import { NextResponse } from 'next/server';
import { getTranslationSegmentsByProjectId, getTranslationProjectById, TranslationSegment, addTranslationSegments } from '@/data/mockData';

// Function to generate segments from content
function generateSegmentsFromContent(projectId: string, content: string): TranslationSegment[] {
  const segments: TranslationSegment[] = [];
  
  // Split content into paragraphs and sections
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  let segmentIndex = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip very short lines (less than 10 characters)
    if (trimmedLine.length < 10) continue;
    
    // Create a segment for each substantial line
    const segment: TranslationSegment = {
      id: `segment-${projectId}-${segmentIndex}`,
      translationProjectId: projectId,
      segmentIndex: segmentIndex,
      originalText: trimmedLine,
      translatedText: '',
      status: 'pending',
      translatorNotes: '',
      reviewComments: [],
      lastModified: new Date().toISOString(),
      estimatedWords: trimmedLine.split(' ').length,
      actualWords: 0
    };
    
    segments.push(segment);
    segmentIndex++;
  }
  
  return segments;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { id } = await params;
  let segments = getTranslationSegmentsByProjectId(id);
  
  // If no segments exist (for dynamically created projects), generate them
  if (segments.length === 0) {
    const project = getTranslationProjectById(id);
    if (project && project.originalContent) {
      segments = generateSegmentsFromContent(id, project.originalContent);
      // Save generated segments to mock data so they persist across requests
      addTranslationSegments(segments);
    } else if (project) {
      // Project exists but no original content - this shouldn't happen
      console.warn(`Translation project ${id} found but has no originalContent`);
    } else {
      // Project not found - this is an error
      console.error(`Translation project ${id} not found`);
      return NextResponse.json({
        success: false,
        error: 'Translation project not found',
        data: [],
        stats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          reviewed: 0,
          pending: 0,
          totalWords: 0,
          translatedWords: 0,
          completionPercentage: 0
        }
      }, { status: 404 });
    }
  }
  
  const segmentStats = {
    total: segments.length,
    completed: segments.filter(s => s.status === 'completed').length,
    inProgress: segments.filter(s => s.status === 'in-progress').length,
    reviewed: segments.filter(s => s.status === 'reviewed').length,
    pending: segments.filter(s => s.status === 'pending').length,
    totalWords: segments.reduce((acc, s) => acc + s.estimatedWords, 0),
    translatedWords: segments.reduce((acc, s) => acc + s.actualWords, 0),
    completionPercentage: segments.length > 0 
      ? Math.round((segments.filter(s => s.status === 'completed' || s.status === 'reviewed').length / segments.length) * 100)
      : 0
  };
  
  return NextResponse.json({
    success: true,
    data: segments.sort((a, b) => a.segmentIndex - b.segmentIndex),
    stats: segmentStats
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json();
  
  // Simulate creating new segments by splitting content
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { id } = await params;
  const newSegments = body.content.split('\n\n').map((text: string, index: number) => ({
    id: `segment-${Date.now()}-${index}`,
    translationProjectId: id,
    segmentIndex: index,
    originalText: text.trim(),
    translatedText: '',
    status: 'pending' as const,
    translatorNotes: '',
    reviewComments: [],
    lastModified: new Date().toISOString(),
    estimatedWords: text.trim().split(' ').length,
    actualWords: 0
  }));
  
  return NextResponse.json({
    success: true,
    data: newSegments,
    message: `Created ${newSegments.length} translation segments`
  });
} 