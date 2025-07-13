import { NextResponse } from 'next/server';
import { getActiveTranslationSession, mockTranslationSessions } from '@/data/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'user-1';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const { id } = await params;
  const activeSession = getActiveTranslationSession(id, userId);
  const allSessions = mockTranslationSessions.filter(s => s.translationProjectId === id);
  
  const sessionStats = {
    totalSessions: allSessions.length,
    totalTime: allSessions.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
      }
      return acc;
    }, 0),
    totalSegments: allSessions.reduce((acc, s) => acc + s.segmentsWorked, 0),
    totalWords: allSessions.reduce((acc, s) => acc + s.wordsTranslated, 0),
    totalAutoSaves: allSessions.reduce((acc, s) => acc + s.autoSaves, 0),
    averageSessionTime: allSessions.length > 0 
      ? allSessions.reduce((acc, s) => {
          if (s.endTime) {
            return acc + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime());
          }
          return acc;
        }, 0) / allSessions.filter(s => s.endTime).length
      : 0
  };
  
  return NextResponse.json({
    success: true,
    data: {
      activeSession,
      recentSessions: allSessions.slice(-5),
      stats: sessionStats
    }
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { action, ...body } = await request.json();
  
  // Handle session actions
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { id } = await params;
  switch (action) {
    case 'start':
      const newSession = {
        id: `session-${Date.now()}`,
        translationProjectId: id,
        userId: body.userId || 'user-1',
        startTime: new Date().toISOString(),
        segmentsWorked: 0,
        wordsTranslated: 0,
        autoSaves: 0
      };
      
      return NextResponse.json({
        success: true,
        data: newSession,
        message: 'Translation session started'
      });
      
    case 'update':
      return NextResponse.json({
        success: true,
        data: {
          sessionId: body.sessionId,
          segmentsWorked: body.segmentsWorked || 0,
          wordsTranslated: body.wordsTranslated || 0,
          autoSaves: (body.autoSaves || 0) + 1,
          lastActivity: new Date().toISOString()
        },
        message: 'Session updated'
      });
      
    case 'end':
      return NextResponse.json({
        success: true,
        data: {
          sessionId: body.sessionId,
          endTime: new Date().toISOString(),
          finalStats: {
            duration: Date.now() - new Date(body.startTime).getTime(),
            segmentsCompleted: body.segmentsWorked || 0,
            wordsTranslated: body.wordsTranslated || 0,
            autoSaves: body.autoSaves || 0
          }
        },
        message: 'Translation session ended'
      });
      
    default:
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
  }
} 