import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { awardCertificate, calculateCertificationProgress } from '@/lib/certificationSystem';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreUserProfile } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const rawAuth = request.headers.get('authorization') || request.headers.get('Authorization') || '';
    const userId = await verifyAuthToken(rawAuth);
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { tierId } = body;

    if (!tierId) {
      return NextResponse.json(
        { 
          error: 'Missing tier ID',
          success: false
        },
        { status: 400 }
      );
    }

    // Get user profile to check eligibility
    const userDoc = await firestore.collection('userProfiles').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userProfile = userDoc.data() as FirestoreUserProfile;
    const progress = calculateCertificationProgress(userProfile);

    // Check if this certificate is available to claim
    const availableTier = progress.availableCertificates.find(tier => tier.id === tierId);
    if (!availableTier) {
      return NextResponse.json(
        { 
          error: 'Certificate not available for claiming',
          details: 'You may not have enough words translated or already own this certificate'
        },
        { status: 400 }
      );
    }

    // Award the certificate
    const certificate = await awardCertificate(userId, tierId);

    if (!certificate) {
      return NextResponse.json(
        { 
          error: 'Failed to award certificate',
          details: 'Certificate may already exist'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        certificate,
        tier: availableTier,
        message: `Congratulations! You've earned the ${availableTier.name} certificate!`
      },
      message: `${availableTier.name} certificate awarded successfully!`
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error claiming certificate:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to claim certificate',
        success: false
      }, 
      { status: 400 }
    );
  }
} 