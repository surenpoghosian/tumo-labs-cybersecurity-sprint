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
    
    // Get only public user information for the certificate (name only - no sensitive data)
    let certificateHolderName = 'Unknown';
    try {
      const userDoc = await firestore.collection('userProfiles').doc(certificate.userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as FirestoreUserProfile;
        certificateHolderName = userData.name || 'Certificate Holder';
      }
    } catch (userError) {
      console.warn('Could not fetch user data for certificate:', userError);
      // Continue with default name
    }

    // Return only public certificate information for verification
    // DO NOT expose sensitive user data like GitHub username, email, etc.
    return NextResponse.json({
      success: true,
      data: {
        projectName: certificate.projectName,
        category: certificate.category,
        certificateType: certificate.certificateType,
        verificationCode: certificate.verificationCode,
        issuedDate: certificate.mergedAt || certificate.createdAt,
        holderName: certificateHolderName,
        isValid: true,
        verifiedAt: new Date().toISOString()
      },
      meta: {
        verificationMethod: 'firestore',
        verifiedAt: new Date().toISOString(),
        note: 'This verification shows only public certificate information for privacy protection'
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