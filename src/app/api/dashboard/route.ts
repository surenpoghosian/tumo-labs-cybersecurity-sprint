import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getUserDashboardData } from '@/lib/userInitialization';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    
    // Get comprehensive dashboard data with safe initialization
    const dashboardData = await getUserDashboardData(userId);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      meta: {
        userId,
        timestamp: new Date().toISOString(),
        isEmpty: dashboardData.isEmpty
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard data',
        data: {
          user: null,
          stats: {
            totalFiles: 0,
            filesInProgress: 0,
            filesPending: 0,
            totalCertificates: 0,
            totalCredits: 0,
            wordsTranslated: 0,
            approvedTranslations: 0,
            rejectedTranslations: 0
          },
          currentFiles: [],
          recentProjects: [],
          certificates: [],
          translationMemory: [],
          isEmpty: true
        }
      }, 
      { status: 500 }
    );
  }
} 