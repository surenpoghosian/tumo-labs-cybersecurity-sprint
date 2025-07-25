import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreCertificate, FirestoreUserProfile } from '@/lib/firestore';
import { getCertificateTierById } from '@/lib/certificationSystem';

export const runtime = 'nodejs';

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
    const pdfBuffer = await generateCertificatePDF(certificate, user);

    // Create response with PDF headers
    const response = new NextResponse(pdfBuffer);
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

  // Dynamically import jsPDF to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  
  // Create PDF document (A4 size: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Set up colors and fonts
  const primaryColor = '#e86c00'; // Orange
  const textColor = '#000000';
  
  // Header
  doc.setFontSize(28);
  doc.setTextColor(primaryColor);
  doc.text('Certificate of Achievement', 148.5, 40, { align: 'center' });

  // Decorative line
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(50, 50, 247, 50);

  // Recipient name
  doc.setFontSize(24);
  doc.setTextColor(textColor);
  doc.text(user.name || user.username || 'Translator', 148.5, 80, { align: 'center' });

  // Achievement description
  doc.setFontSize(14);
  const achievementText = `has achieved the ${tier ? tier.name : certificate.type} milestone for contributions to Armenian Cybersecurity documentation.`;
  
  // Split text to fit width
  const splitText = doc.splitTextToSize(achievementText, 180);
  doc.text(splitText, 148.5, 100, { align: 'center' });

  // Project details - adjusted spacing to fit better
  doc.setFontSize(12);
  doc.text(`Project: ${certificate.projectName}`, 148.5, 130, { align: 'center' });
  doc.text(`Category: ${certificate.category}`, 148.5, 140, { align: 'center' });
  doc.text(`Verification Code: ${certificate.verificationCode}`, 148.5, 150, { align: 'center' });
  
  const issueDate = certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`Issued: ${issueDate}`, 148.5, 160, { align: 'center' });

  // Add border - adjusted to fit all content
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.rect(20, 20, 257, 170);

  // Convert to buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
} 