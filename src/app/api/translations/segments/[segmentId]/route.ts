import { NextResponse } from 'next/server';
import { getTranslationSegmentById } from '@/data/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ segmentId: string }> }
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const { segmentId } = await params;
  const segment = getTranslationSegmentById(segmentId);
  
  if (!segment) {
    return NextResponse.json(
      { success: false, error: 'Segment not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    data: segment
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ segmentId: string }> }
) {
  const body = await request.json();
  
  // Simulate updating segment
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { segmentId } = await params;
  const updatedSegment = {
    ...body,
    id: segmentId,
    lastModified: new Date().toISOString(),
    actualWords: body.translatedText ? body.translatedText.split(' ').length : 0,
    status: body.translatedText ? 'completed' : 'in-progress'
  };
  
  return NextResponse.json({
    success: true,
    data: updatedSegment,
    message: 'Segment updated successfully'
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ segmentId: string }> }
) {
  const { action, ...body } = await request.json();
  
  // Handle different segment actions
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const { segmentId } = await params;
  switch (action) {
    case 'add-note':
      return NextResponse.json({
        success: true,
        data: { 
          segmentId: segmentId,
          note: body.note,
          addedAt: new Date().toISOString()
        },
        message: 'Note added successfully'
      });
      
    case 'mark-for-review':
      return NextResponse.json({
        success: true,
        data: { 
          segmentId: segmentId,
          status: 'under-review',
          markedAt: new Date().toISOString()
        },
        message: 'Segment marked for review'
      });
      
    default:
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
  }
} 