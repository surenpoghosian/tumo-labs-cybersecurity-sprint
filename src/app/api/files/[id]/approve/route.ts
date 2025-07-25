import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile } from '@/lib/firestore';
import { checkAndAwardMilestoneCertificates } from '@/lib/certificationSystem';
import type { firestore as FirestoreNS } from 'firebase-admin';
import { admin as firebaseAdmin } from '@/lib/firebaseAdmin';

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
    const { approved, comments } = body;

    // Get current file
    const doc = await firestore.collection('files').doc(fileId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const currentData = doc.data() as FirestoreFile;
    
    // Check if user is a moderator (you might want to enhance this check)
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    if (!userData?.isModerator && userData?.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized: Only moderators can approve translations' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Partial<FirestoreFile> = {
      status: approved ? 'accepted' : 'rejected',
      reviewerId: userId,
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Update the file
    await firestore.collection('files').doc(fileId).update(updateData);

    // If approved, update user stats and check for certificates
    if (approved && currentData.assignedTranslatorId) {
      const translatorId = currentData.assignedTranslatorId;
      // Derive word count: use stored value or calculate from originalText
      let wordCount = currentData.wordCount || 0;
      
      // Handle files with external storage (large files >50KB)
      if (wordCount === 0 && currentData.storageType === 'github_raw' && currentData.contentUrl) {
        try {
          console.log(`Fetching content from URL for word count calculation: ${currentData.contentUrl}`);
          const response = await fetch(currentData.contentUrl);
          if (response.ok) {
            const content = await response.text();
            wordCount = content.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
            console.log(`Calculated word count from external content: ${wordCount}`);
          } else {
            console.error('Failed to fetch content from URL:', response.status);
          }
        } catch (error) {
          console.error('Error fetching content for word count:', error);
        }
      }
      
      // Fallback: calculate from originalText if still 0
      if (wordCount === 0 && currentData.originalText) {
        wordCount = currentData.originalText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
      }
      const FieldValue = (firebaseAdmin as unknown as { firestore: typeof FirestoreNS }).firestore.FieldValue;
      
      // Update translator's stats atomically
        console.log(`Incrementing translator ${translatorId} word count by ${wordCount}`);

        await firestore.collection('userProfiles').doc(translatorId).update({
          totalWordsTranslated: FieldValue.increment(wordCount),
          approvedTranslations: FieldValue.increment(1),
          updatedAt: new Date().toISOString(),
          [`contributedFiles.${fileId}`]: currentData.fileName || 'Unknown File'
        });

        const translatorAfter = await firestore.collection('userProfiles').doc(translatorId).get();
        console.log('New totalWordsTranslated:', translatorAfter.data()?.totalWordsTranslated);
        console.log(`Successfully updated translator stats for ${translatorId}`);

        // Check for milestone certificates
        try {
          const newCertificates = await checkAndAwardMilestoneCertificates(translatorId);
          if (newCertificates.length > 0) {
            console.log(`Awarded ${newCertificates.length} milestone certificates to translator ${translatorId}`);
          }
        } catch (error) {
          console.error('Error checking milestone certificates:', error);
        }
      }

    // Update review record if it exists
    try {
      const reviewSnapshot = await firestore
        .collection('reviews')
        .where('fileId', '==', fileId)
        .limit(1)
        .get();
        
      if (!reviewSnapshot.empty) {
        const reviewDoc = reviewSnapshot.docs[0];
        await firestore.collection('reviews').doc(reviewDoc.id).update({
          status: approved ? 'approved' : 'rejected',
          comments: comments || '',
          reviewerId: userId,
          completedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating review record:', error);
      // Don't fail the approval if review update fails
    }

    const updatedDoc = await firestore.collection('files').doc(fileId).get();
    const updatedFile: FirestoreFile = {
      id: fileId,
      ...updatedDoc.data()
    } as FirestoreFile;

    return NextResponse.json({
      success: true,
      data: updatedFile,
      message: approved ? 'Translation approved successfully' : 'Translation rejected',
      action: approved ? 'approved' : 'rejected'
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error approving/rejecting translation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process approval',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 