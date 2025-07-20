import { NextResponse } from 'next/server';

// Legacy endpoint - replaced by file-based API
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API. Please use /api/files/[id] instead.',
    migration: {
      newEndpoint: '/api/files/[id]',
      documentation: 'Segments are now handled as part of files in the new file-based workflow.'
    }
  }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API. Please use /api/files/[id] instead.',
    migration: {
      newEndpoint: '/api/files/[id]',
      documentation: 'Segments are now handled as part of files in the new file-based workflow.'
    }
  }, { status: 410 });
} 