import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile } from '@/lib/firestore';
import { verifyNextAuthBearerToken } from '@/lib/auth-server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const { id: fileId } = await params;

    if (process.env.USE_MONGO === 'true') {
      const authRes = await verifyNextAuthBearerToken(authHeader);
      if (!authRes.success || !authRes.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const client = await clientPromise;
      const db = client.db('armenian-docs');
      const documents = db.collection('documents');
      const doc = await documents.findOne({ _id: new ObjectId(fileId) });
      if (!doc) return NextResponse.json({ error: 'File not found' }, { status: 404 });
      const canAccess =
        doc.userId?.toString() === authRes.userId ||
        doc.assignedTranslatorId?.toString() === authRes.userId ||
        doc.reviewerId?.toString() === authRes.userId;
      if (!canAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return NextResponse.json({ id: doc._id.toString(), ...doc });
    }

    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    

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

    if (process.env.USE_MONGO === 'true') {
      const authRes = await verifyNextAuthBearerToken(authHeader);
      if (!authRes.success || !authRes.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const client = await clientPromise;
      const db = client.db('armenian-docs');
      const documents = db.collection('documents');
      const current = await documents.findOne({ _id: new ObjectId(fileId) });
      if (!current) return NextResponse.json({ error: 'File not found' }, { status: 404 });
      const isOwner = current.userId?.toString() === authRes.userId;
      const isAssigned = current.assignedTranslatorId?.toString() === authRes.userId;
      const isTakingAvailableFile = status === 'in progress' && current.status === 'not taken' && !current.assignedTranslatorId;
      if (!isOwner && !isAssigned && !isTakingAvailableFile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const update: Record<string, unknown> = { updatedAt: new Date(), lastModified: new Date() };
      if (translatedText !== undefined) update.translatedText = translatedText;
      if (status !== undefined) update.status = status;
      if (assignedTranslatorId !== undefined) update.assignedTranslatorId = new ObjectId(assignedTranslatorId);
      if (reviewerId !== undefined) update.reviewerId = new ObjectId(reviewerId);
      if (actualHours !== undefined) update['metadata.actualHours'] = actualHours;
      if (translations !== undefined) update.translations = translations;
      if (visibility !== undefined) update.visibility = visibility;
      if (publishedAt !== undefined) update.publishedAt = publishedAt;
      if (seoTitle !== undefined) update.seoTitle = seoTitle;
      if (seoDescription !== undefined) update.seoDescription = seoDescription;
      if (seoKeywords !== undefined) update.seoKeywords = seoKeywords;
      if (isTakingAvailableFile) update.assignedTranslatorId = new ObjectId(authRes.userId);
      await documents.updateOne({ _id: new ObjectId(fileId) }, { $set: update });
      const updated = await documents.findOne({ _id: new ObjectId(fileId) });
      return NextResponse.json({ id: fileId, ...updated });
    }

    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
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
    if (status !== undefined) updateData.status = status;
    if (assignedTranslatorId !== undefined) updateData.assignedTranslatorId = assignedTranslatorId;
    if (reviewerId !== undefined) updateData.reviewerId = reviewerId;
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (translations !== undefined) updateData.translations = translations;
    if (visibility !== undefined) updateData.visibility = visibility;
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
    const authHeader = request.headers.get('authorization') || '';
    const { id: fileId } = await params;

    if (process.env.USE_MONGO === 'true') {
      const authRes = await verifyNextAuthBearerToken(authHeader);
      if (!authRes.success || !authRes.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const client = await clientPromise;
      const db = client.db('armenian-docs');
      const documents = db.collection('documents');
      const current = await documents.findOne({ _id: new ObjectId(fileId) });
      if (!current) return NextResponse.json({ error: 'File not found' }, { status: 404 });
      if (current.userId?.toString() !== authRes.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await documents.deleteOne({ _id: new ObjectId(fileId) });
      return NextResponse.json({ message: 'File deleted successfully' });
    }

    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    

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