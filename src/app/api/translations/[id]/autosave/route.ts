import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  
  // Simulate auto-save with minimal delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const { id } = await params;
  const autoSaveData = {
    translationProjectId: id,
    segmentId: body.segmentId,
    content: body.content,
    timestamp: new Date().toISOString(),
    wordCount: body.content ? body.content.split(' ').length : 0,
    characterCount: body.content ? body.content.length : 0
  };
  
  return NextResponse.json({
    success: true,
    data: autoSaveData,
    message: 'Auto-save completed'
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Simulate retrieving auto-save data
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const { id } = await params;
  const autoSaveHistory = [
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      segmentId: 'segment-2',
      wordsAdded: 15,
      action: 'translation'
    },
    {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      segmentId: 'segment-1',
      wordsAdded: 8,
      action: 'translation'
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      segmentId: 'segment-3',
      wordsAdded: 22,
      action: 'translation'
    }
  ];
  
  return NextResponse.json({
    success: true,
    data: {
      projectId: id,
      lastAutoSave: new Date().toISOString(),
      autoSaveCount: autoSaveHistory.length,
      recentActivity: autoSaveHistory
    }
  });
} 