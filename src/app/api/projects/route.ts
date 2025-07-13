import { NextResponse } from 'next/server';
import { getAvailableCyberSecProjects, addTranslationProject } from '@/data/mockData';

export async function GET() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const projects = getAvailableCyberSecProjects();
  
  return NextResponse.json({
    success: true,
    data: projects,
    meta: {
      total: projects.length,
      available: projects.filter(p => p.availableForTranslation).length
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Simulate creating a new translation project
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newTranslationProject = {
    id: `translation-${Date.now()}`,
    cyberSecProjectId: body.projectId,
    documentPath: body.documentPath,
    originalContent: body.originalContent || '',
    translatedContent: '',
    status: 'in-progress' as const,
    assignedTranslatorId: 'user-1', // Current user
    reviewerId: undefined,
    prUrl: undefined,
    createdAt: new Date().toISOString(),
    completedAt: undefined,
    totalSegments: 0,
    completedSegments: 0,
    qualityScore: undefined,
    estimatedHours: 2,
    actualHours: 0
  };
  
  // Add to mock data so it can be found by other APIs
  addTranslationProject(newTranslationProject);
  
  return NextResponse.json({
    success: true,
    data: newTranslationProject,
    message: 'Translation project created successfully'
  });
} 