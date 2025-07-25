import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { calculateCertificationProgress } from '@/lib/certificationSystem';
import { FirestoreUserProfile } from '@/lib/firestore';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    // Get user profile
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const userProfile = userDoc.data() as FirestoreUserProfile;

    // Get user's files and their status
    const filesSnapshot = await firestore
      .collection('files')
      .where('assignedTranslatorId', '==', userId)
      .get();

    const fileStats = {
      total: filesSnapshot.size,
      accepted: 0,
      pending: 0,
      inProgress: 0,
      rejected: 0,
      totalWordCount: 0,
      acceptedWordCount: 0
    };

    const files: { id: string; fileName: string; status: string; wordCount: number }[] = [];
    filesSnapshot.forEach((doc) => {
      const fileData = doc.data();
      files.push({
        id: doc.id,
        fileName: fileData.fileName,
        status: fileData.status,
        wordCount: fileData.wordCount || 0
      });

      const wordCount = fileData.wordCount || 0;
      fileStats.totalWordCount += wordCount;

      if (fileData.status === 'accepted') {
        fileStats.accepted++;
        fileStats.acceptedWordCount += wordCount;
      } else if (fileData.status === 'pending') {
        fileStats.pending++;
      } else if (fileData.status === 'in progress') {
        fileStats.inProgress++;
      } else if (fileData.status === 'rejected') {
        fileStats.rejected++;
      }
    });

    // Calculate certification progress
    const certificationProgress = calculateCertificationProgress(userProfile);

    return NextResponse.json({
      success: true,
      userId,
      userProfile: {
        name: userProfile.name,
        email: userProfile.email,
        totalWordsTranslated: userProfile.totalWordsTranslated || 0,
        approvedTranslations: userProfile.approvedTranslations || 0,
        rejectedTranslations: userProfile.rejectedTranslations || 0,
        certificates: userProfile.certificates || []
      },
      fileStats,
      files,
      certificationProgress: {
        currentTier: certificationProgress.currentTier?.name || 'None',
        nextTier: certificationProgress.nextTier?.name || 'Max Level',
        totalWords: certificationProgress.totalWords,
        wordsToNext: certificationProgress.wordsToNext,
        progressPercentage: certificationProgress.progressPercentage,
        availableCertificates: certificationProgress.availableCertificates.map(c => c.name)
      },
      discrepancy: {
        userProfileWords: userProfile.totalWordsTranslated || 0,
        calculatedFromFiles: fileStats.acceptedWordCount,
        difference: (userProfile.totalWordsTranslated || 0) - fileStats.acceptedWordCount
      }
    });

  } catch (error) {
    console.error('Debug user stats error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 