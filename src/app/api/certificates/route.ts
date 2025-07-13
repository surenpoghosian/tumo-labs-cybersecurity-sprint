import { NextResponse } from 'next/server';
import { getCertificatesByUserId } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'user-1';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const userCertificates = getCertificatesByUserId(userId);
  
  return NextResponse.json({
    success: true,
    data: userCertificates,
    meta: {
      total: userCertificates.length,
      byCategory: userCertificates.reduce((acc, cert) => {
        acc[cert.category] = (acc[cert.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Simulate certificate generation after PR merge
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newCertificate = {
    id: `cert-${Date.now()}`,
    userId: body.userId,
    projectId: body.projectId,
    projectName: body.projectName,
    githubRepo: body.githubRepo,
    prUrl: body.prUrl,
    mergedAt: new Date().toISOString(),
    certificateType: 'translation' as const,
    category: body.category,
    verificationCode: `CYBS-CERT-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    pdfUrl: `/certificates/cert-${Date.now()}.pdf`
  };
  
  return NextResponse.json({
    success: true,
    data: newCertificate,
    message: 'Certificate generated successfully'
  });
} 