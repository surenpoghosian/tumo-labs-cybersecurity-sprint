import { NextResponse } from 'next/server';
import { getTranslationProjectById } from '@/data/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { id } = await params;
  const translation = getTranslationProjectById(id);
  
  if (!translation) {
    return NextResponse.json(
      { success: false, error: 'Translation project not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    data: translation
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  
  // Simulate updating translation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { id } = await params;
  const updatedTranslation = {
    ...body,
    id: id,
    updatedAt: new Date().toISOString()
  };
  
  return NextResponse.json({
    success: true,
    data: updatedTranslation,
    message: 'Translation updated successfully'
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const body = request;
  // Simulate deleting translation project
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return NextResponse.json({
    success: true,
    message: 'Translation project deleted successfully'
  });
} 