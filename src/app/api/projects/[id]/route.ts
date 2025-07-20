import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreProject, getProjectFiles } from '@/lib/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    const { id: projectId } = await params;

    const doc = await firestore.collection('projects').doc(projectId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const data = doc.data();
    const project: FirestoreProject = {
      id: doc.id,
      ...data
    } as FirestoreProject;

    // Get project files
    const files = await getProjectFiles(projectId, userId);

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        projectFiles: files // Include files in response for convenience
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();
    const { id: projectId } = await params;
    
    const body = await request.json();
    const { 
      title,
      version,
      description,
      developedBy,
      difficulty,
      source,
      categories,
      status,
      estimatedHours,
      translationProgress,
      availableForTranslation,
      files
    } = body;

    // Get current project
    const doc = await firestore.collection('projects').doc(projectId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentData = doc.data();
    
    // Only allow updates by creator or admin
    if (currentData?.createdBy !== userId) {
      // Check if user is admin/moderator (you might want to add this check)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Partial<FirestoreProject> = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (version !== undefined) updateData.version = version;
    if (description !== undefined) updateData.description = description;
    if (developedBy !== undefined) updateData.developedBy = developedBy;
    if (difficulty !== undefined) updateData.difficulty = Number(difficulty);
    if (source !== undefined) updateData.source = source;
    if (categories !== undefined) {
      if (!Array.isArray(categories)) {
        return NextResponse.json(
          { error: 'Categories must be an array' },
          { status: 400 }
        );
      }
      updateData.categories = categories;
    }
    if (status !== undefined) updateData.status = status;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (translationProgress !== undefined) updateData.translationProgress = translationProgress;
    if (availableForTranslation !== undefined) updateData.availableForTranslation = availableForTranslation;
    if (files !== undefined) updateData.files = files;

    await firestore.collection('projects').doc(projectId).update(updateData);

    const updatedDoc = await firestore.collection('projects').doc(projectId).get();
    const updatedProject: FirestoreProject = {
      id: projectId,
      ...updatedDoc.data()
    } as FirestoreProject;

    return NextResponse.json(updatedProject);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();
    const { id: projectId } = await params;

    const doc = await firestore.collection('projects').doc(projectId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const data = doc.data();
    
    // Only allow deletion by the creator or admin
    if (data?.createdBy !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete associated files first
    const files = await getProjectFiles(projectId, userId);
    const batch = firestore.batch();
    
    files.forEach(file => {
      const fileRef = firestore.collection('files').doc(file.id);
      batch.delete(fileRef);
    });

    // Delete the project
    const projectRef = firestore.collection('projects').doc(projectId);
    batch.delete(projectRef);

    await batch.commit();

    return NextResponse.json({ message: 'Project and associated files deleted successfully' });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' }, 
      { status: 500 }
    );
  }
} 