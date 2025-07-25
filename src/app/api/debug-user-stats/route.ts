import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreUserProfile } from '@/lib/firestore';
import { calculateCertificationProgress, CERTIFICATE_TIERS } from '@/lib/certificationSystem';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();

    // Get user profile
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({
        error: 'User profile not found',
        userId
      }, { status: 404 });
    }

    const userProfile = userDoc.data() as FirestoreUserProfile;
    const progress = calculateCertificationProgress(userProfile);

    // Get user's certificates from Firestore
    const certificatesSnapshot = await firestore
      .collection('certificates')
      .where('userId', '==', userId)
      .get();
    
    const existingCertificates = certificatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      userId,
      userProfile: {
        totalWordsTranslated: userProfile.totalWordsTranslated || 0,
        certificates: userProfile.certificates || [],
        approvedTranslations: userProfile.approvedTranslations || 0,
        name: userProfile.name,
        username: userProfile.username
      },
      certificationProgress: progress,
      allTiers: CERTIFICATE_TIERS.map(tier => ({
        id: tier.id,
        name: tier.name,
        wordsRequired: tier.wordsRequired,
        userQualifies: (userProfile.totalWordsTranslated || 0) >= tier.wordsRequired,
        alreadyEarned: (userProfile.certificates || []).includes(tier.id)
      })),
      existingCertificatesInDb: existingCertificates,
      debug: {
        totalWords: userProfile.totalWordsTranslated || 0,
        earnedCertificateIds: userProfile.certificates || [],
        availableCertificateCount: progress.availableCertificates.length,
        availableCertificateIds: progress.availableCertificates.map(c => c.id),
        bronzeRequirement: 500,
        qualifiesForBronze: (userProfile.totalWordsTranslated || 0) >= 500,
        hasBronzeCertificate: (userProfile.certificates || []).includes('bronze')
      }
    });

  } catch (error) {
    console.error('Debug user stats error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
} 