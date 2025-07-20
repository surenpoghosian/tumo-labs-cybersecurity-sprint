import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';

// Certificate endpoint - simplified for now
export async function GET() {
  try {
    const userId = await verifyAuthToken();
    
    // Return empty certificates for now - will be implemented with proper auth later
    return NextResponse.json({
      success: true,
      data: [],
      meta: {
        userId,
        total: 0,
        byCategory: {},
        note: 'Certificate functionality will be implemented with full authentication system',
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