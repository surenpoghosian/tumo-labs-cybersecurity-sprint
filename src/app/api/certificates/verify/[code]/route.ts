import { NextResponse } from 'next/server';
import { mockCertificates, getUserById } from '@/data/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  // Simulate API delay for verification
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const { code } = await params;
  const certificate = mockCertificates.find(cert => cert.verificationCode === code);
  
  if (!certificate) {
    return NextResponse.json(
      { success: false, error: 'Certificate not found or invalid verification code' },
      { status: 404 }
    );
  }
  
  const user = getUserById(certificate.userId);
  
  return NextResponse.json({
    success: true,
    data: {
      ...certificate,
      user: user ? {
        name: user.name,
        githubUsername: user.githubUsername
      } : null,
      isValid: true,
      verifiedAt: new Date().toISOString()
    }
  });
} 