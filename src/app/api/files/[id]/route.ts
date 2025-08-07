import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile } from '@/lib/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
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
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    const { id: fileId } = await params;
    
    const body = await request.json();
    const { 
      translatedText, 
      status, 
      assignedTranslatorId,
      reviewerId,
      actualHours,
      translations,
      visibility,
      publishedAt,
      seoTitle,
      seoDescription,
      seoKeywords
    } = body;

    // Get current file
    const doc = await firestore.collection('files').doc(fileId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const currentData = doc.data();
    
    // Check if user has access to update this file
    // Allow if: user owns file, user is assigned, or user is taking an available file
    const isOwner = currentData?.uId === userId;
    const isAssigned = currentData?.assignedTranslatorId === userId;
    const isTakingAvailableFile = status === 'in progress' && currentData?.status === 'not taken' && !currentData?.assignedTranslatorId;
    
    if (!isOwner && !isAssigned && !isTakingAvailableFile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Partial<FirestoreFile> = {
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    if (translatedText !== undefined) updateData.translatedText = translatedText;

    // Prevent users from self-approving or arbitrarily publishing files via status
    if (status !== undefined) {
      const allowedStatuses: Array<FirestoreFile['status']> = ['in progress', 'pending'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
      }
      updateData.status = status;
    }

    // Only allow assigning yourself when taking an available file; otherwise block
    if (assignedTranslatorId !== undefined && assignedTranslatorId !== userId) {
      return NextResponse.json({ error: 'Cannot assign other users' }, { status: 403 });
    }
    if (assignedTranslatorId !== undefined) updateData.assignedTranslatorId = assignedTranslatorId;

    // Reviewer can only be set by moderators in dedicated endpoints
    if (reviewerId !== undefined) {
      return NextResponse.json({ error: 'Reviewer can only be assigned by moderators' }, { status: 403 });
    }
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (translations !== undefined) updateData.translations = translations;
    // Visibility changes restricted: only moderators can change visibility in approval flow
    if (visibility !== undefined) {
      return NextResponse.json({ error: 'Visibility can only be changed by moderators' }, { status: 403 });
    }
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;

    // If taking a file, assign it to the user
    if (status === 'in progress' && !currentData?.assignedTranslatorId) {
      updateData.assignedTranslatorId = userId;
      
      // Update user's current files
      // await updateUserStats(userId, { // This line was removed as per the edit hint
      //   currentFiles: { [fileId]: currentData?.fileName || 'Unknown File' }
      // });
    }

    // When submitting for review, just update current files (word count will be added when approved)
    if (status === 'pending' && currentData?.status !== 'pending') {
      // await updateUserStats(userId, { // This line was removed as per the edit hint
      //   contributedFiles: { [fileId]: currentData?.fileName || 'Unknown File' }
      // });
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