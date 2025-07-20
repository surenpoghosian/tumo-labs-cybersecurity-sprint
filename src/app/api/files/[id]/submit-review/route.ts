import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile, FirestoreReview } from '@/lib/firestore';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    const { id: fileId } = await params;
    
    const body = await request.json();
    const { translatedText, actualHours, translatorNotes } = body;

    // Get current file
    const doc = await firestore.collection('files').doc(fileId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const currentData = doc.data() as FirestoreFile;
    
    // Check if user has permission to submit this translation
    if (currentData.assignedTranslatorId !== userId) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only submit your own translations' 
      }, { status: 403 });
    }

    // Check if file is in the right status
    if (currentData.status !== 'in progress') {
      return NextResponse.json({ 
        error: `File cannot be submitted for review. Current status: ${currentData.status}`,
        details: {
          currentStatus: currentData.status,
          requiredStatus: 'in progress'
        }
      }, { status: 400 });
    }

    // Validate translation is not empty
    if (!translatedText || !translatedText.trim()) {
      return NextResponse.json({ 
        error: 'Translation text cannot be empty' 
      }, { status: 400 });
    }

    // Generate review ID
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Determine category from project
    let category = 'general';
    try {
      const projectDoc = await firestore.collection('projects').doc(currentData.projectId).get();
      if (projectDoc.exists) {
        const projectData = projectDoc.data();
        category = projectData?.categories?.[0] || 'general';
      }
    } catch (error) {
      console.log('Could not fetch project for category:', error);
    }

    // Create review entry
    const reviewData: Omit<FirestoreReview, 'id'> = {
      uId: userId, // Creator's ID for rules
      fileId: fileId,
      translationId: `translation-${fileId}-${Date.now()}`,
      reviewerId: '', // Will be assigned later by moderators
      status: 'pending',
      priority: 'medium',
      comments: translatorNotes || '',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      estimatedReviewTime: 2, // 2 hours
      reviewType: 'translation',
      category: category,
    };

    // Use batch to update file and create review atomically
    const batch = firestore.batch();

    // Update file status and translation
    const fileRef = firestore.collection('files').doc(fileId);
    batch.update(fileRef, {
      status: 'pending',
      translatedText: translatedText.trim(),
      actualHours: actualHours || 0,
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    });

    // Create review entry
    const reviewRef = firestore.collection('reviews').doc(reviewId);
    batch.set(reviewRef, reviewData);

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        reviewId,
        fileId,
        status: 'pending-review',
        submittedAt: new Date().toISOString(),
        estimatedReviewTime: '2-3 business days',
        message: 'Translation submitted for review successfully'
      },
      message: 'Translation submitted for review successfully'
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error submitting translation for review:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit translation for review',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 