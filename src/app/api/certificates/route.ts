import { NextResponse } from 'next/server';
import { verifyAuthToken, getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreCertificate } from '@/lib/firestore';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const firestore = await getFirestore();
    
    // Get user's certificates from Firestore
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

    // Group by category for stats
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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Certificates API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch certificates' 
      }, 
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Certificate creation is temporarily disabled',
    message: 'This feature will be available when the authentication system is fully implemented'
  }, { status: 501 });
} 