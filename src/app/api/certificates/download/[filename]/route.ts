import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { mockCertificates, getUserById, Certificate, User } from '@/data/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const userId = await verifyAuthToken();
    const { filename } = await params;
    
    // Extract certificate ID from filename (format: cert-{id}.pdf)
    const certificateId = filename.replace('.pdf', '');
    
    // Find the certificate
    const certificate = mockCertificates.find(cert => cert.id === certificateId);
    
    if (!certificate) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Certificate not found',
          code: 'CERTIFICATE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

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
    const user = getUserById(certificate.userId);
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Certificate owner not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Generate mock PDF content (in a real app, you'd use a PDF library like jsPDF or Puppeteer)
    const pdfContent = generateMockPDF(certificate, user);
    
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

function generateMockPDF(certificate: Certificate, user: User): Buffer {
  // This is a mock PDF content. In a real application, you would use a proper PDF library
  // like jsPDF, PDFKit, or Puppeteer to generate actual PDF content
  
  const pdfHeader = '%PDF-1.4\n';
  const mockPDFContent = `
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
>>
>>
>>
endobj

4 0 obj
<<
/Length 500
>>
stream
BT
/F1 24 Tf
50 750 Td
(Armenian CyberSec Docs Certificate) Tj
0 -50 Td
/F1 18 Tf
(Certificate of Achievement) Tj
0 -100 Td
/F1 14 Tf
(This certificate is awarded to:) Tj
0 -30 Td
/F1 16 Tf
(${user.name}) Tj
0 -50 Td
/F1 14 Tf
(For successfully completing the translation of:) Tj
0 -30 Td
/F1 16 Tf
(${certificate.projectName}) Tj
0 -50 Td
/F1 12 Tf
(Category: ${certificate.category}) Tj
0 -25 Td
(Verification Code: ${certificate.verificationCode}) Tj
0 -25 Td
(Issued: ${new Date(certificate.mergedAt).toLocaleDateString()}) Tj
0 -50 Td
(GitHub Repository: ${certificate.githubRepo}) Tj
0 -25 Td
(Pull Request: ${certificate.prUrl}) Tj
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

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
0000000274 00000 n 
0000000815 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
887
%%EOF
`;

  const fullPDF = pdfHeader + mockPDFContent;
  return Buffer.from(fullPDF, 'utf8');
} 