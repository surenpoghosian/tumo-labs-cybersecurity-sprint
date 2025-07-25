import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreCertificate, FirestoreUserProfile } from '@/lib/firestore';
import { getCertificateTierById } from '@/lib/certificationSystem';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Require Bearer authentication header
    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required to download certificates',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    const { filename } = await params;

    // Extract certificate ID from filename (format: {id}.pdf)
    const certificateId = filename.replace('.pdf', '');

    // Find the certificate in Firestore
    const certDoc = await firestore.collection('certificates').doc(certificateId).get();

    if (!certDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate not found',
          code: 'CERTIFICATE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const certificate = { id: certDoc.id, ...certDoc.data() } as FirestoreCertificate;

    // Ensure the authenticated user owns this certificate
    if (certificate.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: You can only download your own certificates',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      );
    }

    // Get user information
    const userDoc = await firestore.collection('userProfiles').doc(certificate.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Certificate owner not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const user = userDoc.data() as FirestoreUserProfile;

    // Generate PDF content
    const pdfContent = generateCertificatePDF(certificate, user);

    // Create response with PDF headers
    const response = new NextResponse(pdfContent);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.headers.set('Cache-Control', 'private, max-age=3600');

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Certificate download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during download',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

function generateCertificatePDF(certificate: FirestoreCertificate, user: FirestoreUserProfile): Buffer {
  const tier = getCertificateTierById(certificate.type);
  const content = `Certificate for ${user.name || 'Translator'} - ${tier ? tier.name : certificate.type}`;
  return Buffer.from(content, 'utf8');
} 