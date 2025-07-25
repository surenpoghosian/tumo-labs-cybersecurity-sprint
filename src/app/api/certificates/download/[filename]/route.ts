import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreCertificate, FirestoreUserProfile } from '@/lib/firestore';
import { getCertificateTierById } from '@/lib/certificationSystem';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
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

    // Check if the authenticated user owns this certificate
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
    
    // Set appropriate headers for PDF download
    const response = new NextResponse(pdfContent);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    response.headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour privately
    
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
  // Get tier information for enhanced certificate design
  const tier = getCertificateTierById(certificate.type);
  
  const pdfHeader = '%PDF-1.4\n';
  const certificateContent = `
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
/F2 6 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 800
>>
stream
BT
/F1 28 Tf
50 720 Td
(Armenian Cybersecurity Documentation) Tj
0 -30 Td
/F1 24 Tf
(Certificate of Achievement) Tj
0 -60 Td
/F1 20 Tf
(${tier ? tier.icon + ' ' + tier.name : certificate.type.toUpperCase() + ' CERTIFICATE'}) Tj
0 -80 Td
/F1 16 Tf
(This certificate is proudly awarded to:) Tj
0 -40 Td
/F2 22 Tf
(${certificate.fullName || user.name}) Tj
0 -60 Td
/F1 14 Tf
(For outstanding contribution to Armenian cybersecurity education) Tj
0 -25 Td
(through expert translation services and community engagement.) Tj
0 -50 Td
(Achievement Level: ${tier ? tier.name : certificate.type}) Tj
0 -25 Td
(Category: ${certificate.category}) Tj
0 -25 Td
(Project: ${certificate.projectName}) Tj
0 -40 Td
/F1 12 Tf
(Verification Code: ${certificate.verificationCode}) Tj
0 -20 Td
(Certificate ID: ${certificate.id}) Tj
0 -20 Td
(Issued: ${certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : 'N/A'}) Tj
0 -30 Td
(Repository: ${certificate.githubRepo}) Tj
${certificate.prUrl ? `0 -20 Td\n(Pull Request: ${certificate.prUrl}) Tj` : ''}
0 -50 Td
/F1 10 Tf
(This certificate validates genuine contribution to open-source) Tj
0 -15 Td
(cybersecurity education in the Armenian language.) Tj
0 -15 Td
(Verify authenticity at: armenian-cybersec-docs.org/verify) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000274 00000 n 
0000001120 00000 n 
0000001187 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
1259
%%EOF
`;

  const fullPDF = pdfHeader + certificateContent;
  return Buffer.from(fullPDF, 'utf8');
} 