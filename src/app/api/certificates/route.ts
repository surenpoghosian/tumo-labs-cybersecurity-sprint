import { NextResponse } from 'next/server';

// Certificate endpoint - simplified for now
export async function GET() {
  // Return empty certificates for now - will be implemented with proper auth later
  return NextResponse.json({
    success: true,
    data: [],
    meta: {
      total: 0,
      byCategory: {},
      note: 'Certificate functionality will be implemented with full authentication system'
    }
  });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Certificate creation is temporarily disabled',
    message: 'This feature will be available when the authentication system is fully implemented'
  }, { status: 501 });
} 