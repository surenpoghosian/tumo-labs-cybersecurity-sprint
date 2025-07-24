import { NextResponse } from 'next/server';
import { verifyAuthToken, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

// Certificate endpoint - graceful handling for development
export async function GET(request: Request) {
  try {
    // Extract the authorization header
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;
    let authenticated = false;

    // Try to authenticate if auth header is provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Check if Firebase Admin is available first
        const adminAvailable = await isFirebaseAdminAvailable();
        
        if (adminAvailable) {
          userId = await verifyAuthToken(authHeader);
          authenticated = true;
        } else {
          console.warn('Firebase Admin not available - serving certificates without authentication');
        }
      } catch (authError) {
        console.warn('Authentication failed, serving certificates without auth:', authError);
        // Continue without authentication - don't throw error
      }
    }
    
    // PRIVACY PROTECTION: Only return certificates if user is properly authenticated
    if (!authenticated || !userId) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          authenticated: false,
          total: 0,
          byCategory: {},
          note: 'Sign in to view your certificates. Start contributing to earn your first certificate!',
          timestamp: new Date().toISOString()
        }
      });
    }

    // TODO: When implementing full certificate system, fetch certificates only for the authenticated user
    // const userCertificates = await getUserCertificates(userId);
    
    return NextResponse.json({
      success: true,
      data: [], // Will be replaced with actual user certificates
      meta: {
        userId,
        authenticated: true,
        total: 0,
        byCategory: {},
        note: 'Certificate functionality will be implemented with full authentication system',
        timestamp: new Date().toISOString(),
        privacy: 'Only your certificates are returned. Others cannot access your certificate list.'
      }
    });
    
  } catch (error) {
    console.error('Certificates API error:', error);
    
    // Even on error, return empty certificates to prevent UI breaking
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