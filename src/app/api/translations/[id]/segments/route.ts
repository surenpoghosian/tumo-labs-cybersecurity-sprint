import { NextResponse } from 'next/server';

// Legacy endpoint - replaced by file-based API
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API. Please use /api/files instead.',
    migration: {
      newEndpoint: '/api/files',
      documentation: 'Segments are now handled as files in the new file-based workflow.'
    }
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API. Please use /api/files instead.',
    migration: {
      newEndpoint: '/api/files',
      documentation: 'Segments are now handled as files in the new file-based workflow.'
    }
  }, { status: 410 });
} 