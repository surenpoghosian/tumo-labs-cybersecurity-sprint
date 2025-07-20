import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreCertificate, FirestoreUserProfile } from '@/lib/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // Get certificate from Firestore by verification code
    const firestore = await getFirestore();
    const snapshot = await firestore
      .collection('certificates')
      .where('verificationCode', '==', code)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found or invalid verification code' },
        { status: 404 }
      );
    }
    
    const certificateDoc = snapshot.docs[0];
    const certificate: FirestoreCertificate = {
      id: certificateDoc.id,
      ...certificateDoc.data()
    } as FirestoreCertificate;
    
    // Get user information for the certificate
    let user = null;
    try {
      const userDoc = await firestore.collection('userProfiles').doc(certificate.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as FirestoreUserProfile;
        user = {
          name: userData.name,
          githubUsername: userData.githubUsername
        };
      }
    } catch (userError) {
      console.warn('Could not fetch user data for certificate:', userError);
      // Continue without user data - certificate verification should still work
    }

    return NextResponse.json({
      success: true,
      data: {
        ...certificate,
        user,
        isValid: true,
        verifiedAt: new Date().toISOString()
      },
      meta: {
        verificationMethod: 'firestore',
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Certificate verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'Certificate verification failed. Please try again.'
    }, { status: 500 });
  }
} 