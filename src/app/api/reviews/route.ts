/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreReview, FirestoreUserProfile, FirestoreFile, FirestoreProject } from '@/lib/firestore';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    // Get user profile and determine moderation privileges
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    const userProfile = userDoc.exists ? (userDoc.data() as FirestoreUserProfile) : null;
    const hasModerationPrivilege = !!(
      userProfile?.isModerator ||
      userProfile?.role === 'moderator' ||
      userProfile?.role === 'administrator'
    );
    
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const fileIdParam = url.searchParams.get('fileId');
    const assignedToMe = url.searchParams.get('assignedToMe') === 'true';

    // Start with base collection reference
    let query: FirebaseFirestore.Query = firestore.collection('reviews');

    // Filter by status if specified
    if (status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    // Filter by fileId if provided
    if (fileIdParam) {
      query = query.where('fileId', '==', fileIdParam) as any;
    }

    // If assignedToMe is true, only show reviews assigned to this user
    if (assignedToMe) {
      query = query.where('reviewerId', '==', userId) as any;
    } else if (!hasModerationPrivilege) {
      // Non-moderators can only see their own submitted translations or assigned reviews
      query = query.where('createdBy', '==', userId) as any;
    }

    const snapshot = await query.get();
    // Collect reviews then sort by createdAt descending to keep previous behaviour
    const reviews: any[] = [];

    // Fetch additional data for each review
    for (const doc of snapshot.docs) {
      const reviewData = { id: doc.id, ...doc.data() } as FirestoreReview & { id: string };
      
      // Get file information
      let fileData: (FirestoreFile & { id: string }) | null = null;
      try {
        const fileDoc = await firestore.collection('files').doc(reviewData.fileId).get();
        if (fileDoc.exists) {
          fileData = { id: fileDoc.id, ...fileDoc.data() } as FirestoreFile & { id: string };
        }
      } catch (error) {
        console.log('Could not fetch file data:', error);
      }

      // Get project information
      let projectData: (FirestoreProject & { id: string }) | null = null;
      if (fileData?.projectId) {
        try {
          const projectDoc = await firestore.collection('projects').doc(fileData.projectId).get();
          if (projectDoc.exists) {
            projectData = { id: projectDoc.id, ...projectDoc.data() } as FirestoreProject & { id: string };
          }
        } catch (error) {
          console.log('Could not fetch project data:', error);
        }
      }

      // Get translator information
      let translatorData = null;
      const translatorId = fileData?.assignedTranslatorId || fileData?.uId;
      if (translatorId) {
        try {
          const translatorDoc = await firestore.collection('userProfiles').doc(translatorId).get();
          if (translatorDoc.exists) {
            const data = translatorDoc.data();
            translatorData = {
              id: translatorDoc.id,
              name: data?.name || 'Unknown',
              email: data?.email || '',
              username: data?.username || ''
            };
          }
        } catch (error) {
          console.log('Could not fetch translator data:', error);
        }
      }

      reviews.push({
        ...reviewData,
        file: fileData,
        project: projectData,
        translator: translatorData,
      });
    }

    // Sort the reviews array by createdAt in-memory (desc)
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const stats = {
      total: reviews?.length,
      pending: reviews.filter(r => r.status === 'pending')?.length,
      inProgress: reviews.filter(r => r.status === 'in-progress')?.length,
      approved: reviews.filter(r => r.status === 'approved')?.length,
      rejected: reviews.filter(r => r.status === 'rejected')?.length,
    };
    
    return NextResponse.json({
      success: true,
      data: reviews,
      stats,
      meta: {
        userId,
        userRole: userProfile?.role || 'contributor',
        isModerator: hasModerationPrivilege,
        filters: { status, assignedToMe },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Reviews API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch review tasks' 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { 
      reviewId, 
      decision, // 'approve' or 'reject'
      comments,
      securityAccuracyScore,
      languageQualityScore,
      takeReview = false // If true, assign this review to the current user
    } = body;

    // Get user profile and determine moderation privileges
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    const userProfile = userDoc.exists ? (userDoc.data() as FirestoreUserProfile) : null;
    const hasModerationPrivilege = !!(
      userProfile?.isModerator ||
      userProfile?.role === 'moderator' ||
      userProfile?.role === 'administrator'
    );

    if (!hasModerationPrivilege) {
      return NextResponse.json({ 
        error: 'Unauthorized: Only moderators can review translations' 
      }, { status: 403 });
    }

    if (takeReview) {
      // Assign review to current user
      if (!reviewId) {
        return NextResponse.json({ 
          error: 'Review ID is required to take a review' 
        }, { status: 400 });
      }

      const reviewRef = firestore.collection('reviews').doc(reviewId);
      const reviewDoc = await reviewRef.get();
      
      if (!reviewDoc.exists) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      const reviewData = reviewDoc.data() as FirestoreReview;
      
      if (reviewData.reviewerId && reviewData.reviewerId !== userId) {
        return NextResponse.json({ 
          error: 'Review is already assigned to another moderator' 
        }, { status: 400 });
      }

      await reviewRef.update({
        reviewerId: userId,
        status: 'in-progress',
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: { reviewId, assignedTo: userId },
        message: 'Review assigned successfully'
      });
    }

    // Handle review decision
    if (!reviewId || !decision) {
      return NextResponse.json({ 
        error: 'Review ID and decision are required' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(decision)) {
      return NextResponse.json({ 
        error: 'Decision must be either "approve" or "reject"' 
      }, { status: 400 });
    }

    const reviewRef = firestore.collection('reviews').doc(reviewId);
    const reviewDoc = await reviewRef.get();
    
    if (!reviewDoc.exists) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const reviewData = reviewDoc.data() as FirestoreReview;
    
    // Check if user is assigned to this review or is admin
    if (reviewData.reviewerId !== userId && userProfile?.role !== 'administrator') {
      return NextResponse.json({ 
        error: 'You can only review translations assigned to you' 
      }, { status: 403 });
    }

    // Get the file to update its status
    const fileRef = firestore.collection('files').doc(reviewData.fileId);
    const fileDoc = await fileRef.get();
    
    if (!fileDoc.exists) {
      return NextResponse.json({ error: 'Associated file not found' }, { status: 404 });
    }

    // Use batch to update both review and file atomically
    const batch = firestore.batch();

    // Update review
    batch.update(reviewRef, {
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewerId: userId,
      comments: comments || '',
      securityAccuracyScore: securityAccuracyScore || null,
      languageQualityScore: languageQualityScore || null,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update file status
    const fileUpdateData: any = {
      status: decision === 'approve' ? 'accepted' : 'rejected',
      reviewerId: userId,
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    
    // Set default visibility for approved documents
    if (decision === 'approve') {
      fileUpdateData.visibility = 'public'; // Default to public
      fileUpdateData.publishedAt = new Date().toISOString();
    }
    
    batch.update(fileRef, fileUpdateData);

    await batch.commit();

    // After committing review & file status, update translator statistics
    const fileData = fileDoc.data() as FirestoreFile;
    const translatorId = fileData.assignedTranslatorId || fileData.uId;
    if (translatorId) {
      const firebaseAdmin = await import('firebase-admin');
      const statsRef = firestore.collection('userProfiles').doc(translatorId);
      
      if (decision === 'approve') {
        // Calculate word count for approved translations
        let wordCount = fileData.wordCount || 0;
        
        // Handle files with external storage (large files >50KB)
        if (wordCount === 0 && fileData.storageType === 'github_raw' && fileData.contentUrl) {
          try {
            console.log(`Fetching content from URL for word count calculation: ${fileData.contentUrl}`);
            const response = await fetch(fileData.contentUrl);
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
        if (wordCount === 0 && fileData.originalText) {
          wordCount = fileData.originalText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
        }
        
        console.log(`Incrementing translator ${translatorId} word count by ${wordCount}`);
        
        // Update translator's stats atomically including word count
        await statsRef.update({
          totalWordsTranslated: firebaseAdmin.firestore.FieldValue.increment(wordCount),
          approvedTranslations: firebaseAdmin.firestore.FieldValue.increment(1),
          updatedAt: new Date().toISOString(),
          [`contributedFiles.${reviewData.fileId}`]: fileData.fileName || 'Unknown File'
        });

        const translatorAfter = await statsRef.get();
        console.log('New totalWordsTranslated:', translatorAfter.data()?.totalWordsTranslated);
        console.log(`Successfully updated translator stats for ${translatorId}`);

        // Check for milestone certificates
        try {
          const { checkAndAwardMilestoneCertificates } = await import('@/lib/certificationSystem');
          const newCertificates = await checkAndAwardMilestoneCertificates(translatorId);
          if (newCertificates.length > 0) {
            console.log(`Awarded ${newCertificates.length} milestone certificates to translator ${translatorId}`);
          }
        } catch (error) {
          console.error('Error checking milestone certificates:', error);
        }
      } else {
        // For rejections, only increment rejection counter
        await statsRef.update({
          rejectedTranslations: firebaseAdmin.firestore.FieldValue.increment(1),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviewId,
        decision,
        fileId: reviewData.fileId,
        status: decision === 'approve' ? 'approved' : 'rejected',
        reviewedBy: userId,
        completedAt: new Date().toISOString()
      },
      message: `Translation ${decision === 'approve' ? 'approved' : 'rejected'} successfully`
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Review submission error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process review',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 