import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreCertificate } from '@/lib/firestore';

// Certificates API - returns the authenticated user's certificates and summary metadata
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();

    // Fetch user's certificates from Firestore
    let certificates: FirestoreCertificate[] = [];
    try {
      const snapshot = await firestore
        .collection('certificates')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      snapshot.forEach((doc) => {
        certificates.push({
          id: doc.id,
          ...doc.data()
        } as FirestoreCertificate);
      });
    } catch {
      console.error('Error fetching certificates');
      certificates = [];
    }

    // Build category statistics
    const byCategory = certificates.reduce((acc, cert) => {
      const category = cert.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: certificates,
      meta: {
        userId,
        total: certificates.length,
        byCategory,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Certificates API error:', error);
    // Return safe empty response to avoid breaking UI
    return NextResponse.json({
      success: true,
      data: [],
      meta: {
        userId: 'anonymous',
        authenticated: false,
        total: 0,
        byCategory: {},
        note: 'Certificate system temporarily unavailable. Start contributing to earn certificates!',
        timestamp: new Date().toISOString(),
        error: 'Service temporarily unavailable'
      }
    });
  }
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Certificate creation is temporarily disabled',
    message: 'This feature will be available when the authentication system is fully implemented'
  }, { status: 501 });
} 