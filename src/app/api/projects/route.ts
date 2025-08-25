
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreProject } from '@/lib/firestore';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    await verifyAuthToken(authHeader); // Verify user is authenticated
    const firestore = await getFirestore();

    let projects: FirestoreProject[] = [];

    try {
      // Get all projects accessible to the user
      const snapshot = await firestore
        .collection('projects')
        .where('availableForTranslation', '==', true)
        .get();

      // Process each project and calculate real statistics
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const projectId = doc.id;
        
        // Get files for this project to calculate real progress
        const filesSnapshot = await firestore
          .collection('files')
          .where('projectId', '==', projectId)
          .get();

        let totalFiles = 0;
        let completedFiles = 0;
        let estimatedHours = 0;

        filesSnapshot.forEach(fileDoc => {
          const fileData = fileDoc.data();
          totalFiles++;
          // Count both accepted and pending files as progress (pending means translated, waiting for review)
          if (fileData.status === 'accepted' || fileData.status === 'pending') {
            completedFiles++;
          }
          estimatedHours += fileData.estimatedHours || 0;
        });

        // Calculate real translation progress
        const translationProgress = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;

        projects.push({
          ...data,
          id: projectId,
          files: filesSnapshot.docs.map(d => d.id), // Update with actual file IDs
          translationProgress,
          estimatedHours: estimatedHours || data.estimatedHours || 0,
        } as FirestoreProject);
      }
    } catch (err) {
      console.log('No projects found or collection does not exist', err);
      projects = [];
    }

    return NextResponse.json({
      success: true,
      data: projects,
      meta: {
        total: projects?.length,
        available: projects.filter(p => p.availableForTranslation)?.length,
        isEmpty: projects?.length === 0
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        success: false,
        data: [],
        meta: {
          total: 0,
          available: 0,
          isEmpty: true
        }
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { 
      title,
      version,
      description,
      developedBy,
      difficulty,
      source,
      categories,
      estimatedHours,
      availableForTranslation = true
    } = body;

    // Validate required fields (matching MongoDB plan)
    if (!title || !version || !description || !developedBy || difficulty === undefined || !source || !categories) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: title, version, description, developedBy, difficulty, source, categories',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate categories is an array
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { 
          error: 'Categories must be an array',
          success: false
        },
        { status: 400 }
      );
    }

    // Create new project document
    const projectData: Omit<FirestoreProject, 'id'> = {
      uId: userId,
      title: title.trim(),
      version: version.trim(),
      description: description.trim(),
      developedBy: developedBy.trim(),
      difficulty: Math.max(1, Math.min(5, Number(difficulty))), // Ensure 1-5 range
      source: source.trim(),
      categories: categories.filter(cat => cat && cat.trim()), // Remove empty categories
      status: 'not started',
      files: [], // Will be populated when files are added
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedHours: Math.max(0, estimatedHours || 0),
      translationProgress: 0,
      availableForTranslation
    };

    const docRef = await firestore.collection('projects').add(projectData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...projectData
      },
      message: 'Project created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error creating project:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        success: false
      }, 
      { status: 500 }
    );
  }
} 