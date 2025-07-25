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
    const pdfContent = await generateCertificatePDF(certificate, user);

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

async function generateCertificatePDF(certificate: FirestoreCertificate, user: FirestoreUserProfile): Promise<Buffer> {
  const tier = getCertificateTierById(certificate.type);

  // Dynamically import pdfkit to avoid issues during edge runtimes.
  // pdfkit does not ship with its own type declarations and pulling in
  // @types/pdfkit would add an additional dependency. For our simple use
  // case we can safely suppress the TS error and cast to `any`.
  // @ts-expect-error - No type declarations for pdfkit but runtime import is safe
  const { default: PDFDocument } = await import('pdfkit');

  // Create PDF document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  const buffers: Buffer[] = [];
  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    // Header
    doc
      .fontSize(24)
      .fillColor('#e86c00')
      .text('Certificate of Achievement', { align: 'center' });

    doc.moveDown(2);

    // Recipient
    doc
      .fontSize(18)
      .fillColor('#000000')
      .text(`${user.name || user.username || 'Translator'}`, { align: 'center' });

    doc.moveDown();

    // Achievement description
    doc.fontSize(12).text(
      `has achieved the ${tier ? tier.name : certificate.type} milestone ` +
      `for contributions to Armenian Cybersecurity documentation.`,
      {
        align: 'center',
        width: 400,
        height: 100,
        ellipsis: true,
      }
    );

    doc.moveDown(2);

    // Project / Details
    doc.fontSize(12).text(`Project: ${certificate.projectName}`, { align: 'center' });
    doc.fontSize(12).text(`Category: ${certificate.category}`, { align: 'center' });
    doc.fontSize(12).text(`Verification Code: ${certificate.verificationCode}`, { align: 'center' });
    doc.fontSize(12).text(`Issued: ${certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, { align: 'center' });

    doc.moveDown(4);

    // Signature placeholder
    doc.fontSize(12).text('______________________________', { align: 'right' });
    doc.fontSize(10).text('Armenian CyberSec Docs', { align: 'right' });

    // Finalize
    doc.end();
  });
} 