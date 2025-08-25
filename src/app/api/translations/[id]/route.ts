import { NextResponse } from 'next/server';

// Legacy endpoint - replaced by file-based API
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API. Please use /api/files/[id] instead.',
    migration: {
      newEndpoint: '/api/files/[id]',
      documentation: 'See the file-based translation documentation for the new workflow.'
    }
  }, { status: 410 });
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'This endpoint has been replaced by the file-based translation API. Please use /api/files/[id] instead.',
    migration: {
      newEndpoint: '/api/files/[id]',
      documentation: 'See the file-based translation documentation for the new workflow.'
    }
  }, { status: 410 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  // Simulate API response
  // Simulate deleting translation project
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return NextResponse.json({
    success: true,
    message: 'Translation project deleted successfully'
  });
} 