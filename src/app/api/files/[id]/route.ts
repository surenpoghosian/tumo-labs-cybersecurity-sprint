import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile, updateUserStats } from '@/lib/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();
    const { id: fileId } = await params;

    const doc = await firestore.collection('files').doc(fileId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const data = doc.data();
    
    // Check if user has access (owns the file or is assigned to it)
    if (data?.uId !== userId && data?.assignedTranslatorId !== userId && data?.reviewerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const file: FirestoreFile = {
      id: doc.id,
      ...data
    } as FirestoreFile;

    return NextResponse.json(file);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching file:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' }, 
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
    const { id: fileId } = await params;
    
    const body = await request.json();
    const { 
      translatedText, 
      status, 
      assignedTranslatorId,
      reviewerId,
      actualHours,
      translations 
    } = body;

    // Get current file
    const doc = await firestore.collection('files').doc(fileId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const currentData = doc.data();
    
    // Check if user has access
    if (currentData?.uId !== userId && currentData?.assignedTranslatorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Partial<FirestoreFile> = {
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    if (translatedText !== undefined) updateData.translatedText = translatedText;
    if (status !== undefined) updateData.status = status;
    if (assignedTranslatorId !== undefined) updateData.assignedTranslatorId = assignedTranslatorId;
    if (reviewerId !== undefined) updateData.reviewerId = reviewerId;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (translations !== undefined) updateData.translations = translations;

    // If taking a file, assign it to the user
    if (status === 'in progress' && !currentData?.assignedTranslatorId) {
      updateData.assignedTranslatorId = userId;
      
      // Update user's current files
      await updateUserStats(userId, {
        currentFiles: { [fileId]: currentData?.fileName || 'Unknown File' }
      });
    }

    // If completing a file, update user stats
    if (status === 'pending' && currentData?.status !== 'pending') {
      const wordCount = currentData?.wordCount || 0;
      await updateUserStats(userId, {
        totalWordsTranslated: (currentData?.totalWordsTranslated || 0) + wordCount,
        contributedFiles: { [fileId]: currentData?.fileName || 'Unknown File' }
      });
    }

    await firestore.collection('files').doc(fileId).update(updateData);

    const updatedDoc = await firestore.collection('files').doc(fileId).get();
    const updatedFile: FirestoreFile = {
      id: fileId,
      ...updatedDoc.data()
    } as FirestoreFile;

    return NextResponse.json(updatedFile);

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' }, 
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
    const { id: fileId } = await params;

    const doc = await firestore.collection('files').doc(fileId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const data = doc.data();
    
    // Only allow deletion by the creator or admin
    if (data?.createdBy !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await firestore.collection('files').doc(fileId).delete();

    return NextResponse.json({ message: 'File deleted successfully' });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' }, 
      { status: 500 }
    );
  }
} 