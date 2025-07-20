import { NextResponse } from 'next/server';

// Legacy endpoint - replaced by file-based API
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API.',
    migration: {
      newEndpoint: '/api/files/[id]',
      documentation: 'Autosave functionality is now part of the file-based workflow.'
    }
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API.',
    migration: {
      newEndpoint: '/api/files/[id]',
      documentation: 'Autosave functionality is now part of the file-based workflow.'
    }
  }, { status: 410 });
} 