import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getAllTranslationProjects, getTranslationSegmentsByProjectId, mockTranslationSessions, mockCyberSecProjects } from '@/data/mockData';

export async function GET(request: Request) {
  try {
    const userId = await verifyAuthToken();
    
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    
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
    
    // Filter data by timeframe and authenticated user only
    let projects = getAllTranslationProjects().filter(p => p.assignedTranslatorId === userId);
    let segments = projects.flatMap(p => getTranslationSegmentsByProjectId(p.id));
    let sessions = mockTranslationSessions.filter(s => s.userId === userId);
    
    projects = projects.filter(p => new Date(p.createdAt) >= cutoffDate);
    segments = segments.filter(s => new Date(s.lastModified) >= cutoffDate);
    sessions = sessions.filter(s => new Date(s.startTime) >= cutoffDate);
    
    // Calculate statistics
    const totalWords = segments.reduce((sum, segment) => sum + segment.actualWords, 0);
    const translatedWords = segments.filter(s => s.status === 'completed' || s.status === 'reviewed').reduce((sum, segment) => sum + segment.actualWords, 0);
    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((sum, session) => {
      if (session.endTime) {
        const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
        return sum + Math.max(0, duration); // Duration in milliseconds
      }
      return sum;
    }, 0);
    
    // Progress by day
    const dailyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayProjects = projects.filter(p => {
        const pDate = new Date(p.completedAt || p.createdAt);
        return pDate.toDateString() === date.toDateString();
      });
      
      dailyProgress.push({
        date: date.toISOString().split('T')[0],
        wordsTranslated: dayProjects.reduce((sum, p) => sum + (p.translatedContent?.split(' ').length || 0), 0),
        sessionsCompleted: sessions.filter(s => {
          const sDate = new Date(s.startTime);
          return sDate.toDateString() === date.toDateString();
        }).length
      });
    }
    
    // Quality metrics (using project quality scores since segments don't have quality scores)
    const qualityScore = projects.length > 0 
      ? projects.reduce((sum, p) => sum + (p.qualityScore || 0.8), 0) / projects.length 
      : 0;
    
    // Project categories
    const categoryStats = projects.reduce((acc, project) => {
      const sourceProject = mockCyberSecProjects.find(sp => sp.id === project.cyberSecProjectId);
      const category = sourceProject?.category || 'general';
      if (!acc[category]) {
        acc[category] = { count: 0, wordsTranslated: 0 };
      }
      acc[category].count++;
      acc[category].wordsTranslated += project.translatedContent?.split(' ').length || 0;
      return acc;
    }, {} as Record<string, { count: number; wordsTranslated: number }>);
    
    // Recent achievements
    const recentAchievements = [
      ...(translatedWords >= 1000 ? [{ 
        type: 'milestone', 
        title: '1000+ Words Translated', 
        description: `You've translated ${translatedWords} words in the last ${timeframe}!`,
        achievedAt: new Date().toISOString()
      }] : []),
      ...(projects.length >= 5 ? [{ 
        type: 'productivity', 
        title: 'Productive Translator', 
        description: `Completed ${projects.length} projects!`,
        achievedAt: new Date().toISOString()
      }] : []),
      ...(qualityScore >= 0.9 ? [{ 
        type: 'quality', 
        title: 'High Quality Work', 
        description: `Maintaining ${(qualityScore * 100).toFixed(1)}% quality score!`,
        achievedAt: new Date().toISOString()
      }] : [])
    ];
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalWords,
          translatedWords,
          completionRate: totalWords > 0 ? (translatedWords / totalWords) * 100 : 0,
          totalProjects: projects.length,
          completedProjects: projects.filter(p => p.status === 'merged').length,
          totalSessions,
          totalTime: Math.round(totalTime),
          averageSessionTime: totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0,
          qualityScore: Math.round(qualityScore * 100)
        },
        dailyProgress,
        categoryStats,
        recentAchievements,
        timeframe,
        generatedAt: new Date().toISOString()
      },
      meta: {
        userId,
        timeframe,
        dataPointsCount: {
          projects: projects.length,
          segments: segments.length,
          sessions: sessions.length
        }
      }
    });
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch analytics data' 
      }, 
      { status: 500 }
    );
  }
} 