import { NextResponse } from 'next/server';
import { getAllTranslationProjects, getTranslationSegmentsByProjectId, mockTranslationSessions } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || '7d';
  const userId = searchParams.get('userId');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Calculate various analytics
  const now = new Date();
  const timeframeMs = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000
  };
  
  const cutoffDate = new Date(now.getTime() - (timeframeMs[timeframe as keyof typeof timeframeMs] || timeframeMs['7d']));
  
  // Filter data by timeframe and user if specified
  let projects = getAllTranslationProjects();
  let segments = projects.flatMap(p => getTranslationSegmentsByProjectId(p.id));
  let sessions = mockTranslationSessions;
  
  if (userId) {
    projects = projects.filter(p => p.assignedTranslatorId === userId);
    sessions = sessions.filter(s => s.userId === userId);
  }
  
  projects = projects.filter(p => new Date(p.createdAt) >= cutoffDate);
  segments = segments.filter(s => new Date(s.lastModified) >= cutoffDate);
  sessions = sessions.filter(s => new Date(s.startTime) >= cutoffDate);
  
  // Calculate productivity metrics
  const productivity = {
    totalProjects: projects.length,
    completedProjects: projects.filter(p => p.status === 'merged').length,
    totalSegments: segments.length,
    completedSegments: segments.filter(s => s.status === 'completed' || s.status === 'reviewed').length,
    totalWords: segments.reduce((acc, s) => acc + s.actualWords, 0),
    averageWordsPerSegment: segments.length > 0 
      ? Math.round(segments.reduce((acc, s) => acc + s.actualWords, 0) / segments.length)
      : 0,
    totalSessionTime: sessions.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
      }
      return acc;
    }, 0),
    averageSessionTime: sessions.filter(s => s.endTime).length > 0
      ? sessions.reduce((acc, s) => {
          if (s.endTime) {
            return acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
          }
          return acc;
        }, 0) / sessions.filter(s => s.endTime).length
      : 0,
    wordsPerHour: 0 // Calculate based on session time
  };
  
  if (productivity.totalSessionTime > 0) {
    productivity.wordsPerHour = Math.round(
      (productivity.totalWords / (productivity.totalSessionTime / (1000 * 60 * 60)))
    );
  }
  
  // Quality metrics
  const quality = {
    averageQualityScore: projects.length > 0
      ? projects.reduce((acc, p) => acc + (p.qualityScore || 0), 0) / projects.filter(p => p.qualityScore).length
      : 0,
    segmentAccuracy: segments.length > 0
      ? segments.filter(s => s.reviewComments.length === 0).length / segments.length
      : 0,
    reviewComments: segments.reduce((acc, s) => acc + s.reviewComments.length, 0),
    resolvedComments: segments.reduce((acc, s) => 
      acc + s.reviewComments.filter(c => c.resolved).length, 0
    )
  };
  
  // Time tracking
  const timeTracking = {
    estimatedHours: projects.reduce((acc, p) => acc + p.estimatedHours, 0),
    actualHours: projects.reduce((acc, p) => acc + p.actualHours, 0),
    efficiency: projects.length > 0
      ? projects.reduce((acc, p) => acc + p.actualHours, 0) / 
        projects.reduce((acc, p) => acc + p.estimatedHours, 0)
      : 0,
    totalSessions: sessions.length,
    averageSessionsPerDay: sessions.length / Math.max(1, Math.ceil((timeframeMs[timeframe as keyof typeof timeframeMs] || timeframeMs['7d']) / (24 * 60 * 60 * 1000)))
  };
  
  // Daily breakdown
  const dailyBreakdown = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const daySegments = segments.filter(s => {
      const segmentDate = new Date(s.lastModified);
      return segmentDate.toDateString() === date.toDateString();
    });
    
    dailyBreakdown.push({
      date: date.toISOString().split('T')[0],
      segments: daySegments.length,
      words: daySegments.reduce((acc, s) => acc + s.actualWords, 0),
      sessions: sessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.toDateString() === date.toDateString();
      }).length
    });
  }
  
  return NextResponse.json({
    success: true,
    data: {
      timeframe,
      productivity,
      quality,
      timeTracking,
      dailyBreakdown,
      generatedAt: new Date().toISOString()
    }
  });
} 