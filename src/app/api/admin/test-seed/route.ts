import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { seedExampleData } from '@/lib/seed-example-data';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    
    // Seed the data
    const result = await seedExampleData(userId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test data seeded successfully',
        data: {
          projects: result.data?.projects.map(p => ({
            id: p.id,
            title: p.title,
            version: p.version,
            developedBy: p.developedBy,
            fileCount: p.files.length,
            categories: p.categories
          })),
          files: result.data?.files.map(f => ({
            id: f.id,
            fileName: f.fileName,
            filePath: f.filePath,
            folderPath: f.folderPath,
            wordCount: f.wordCount,
            status: f.status,
            storageType: f.storageType
          })),
          totals: {
            projects: result.data?.projects.length || 0,
            files: result.data?.files.length || 0
          }
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 });
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error in test seed API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to seed test data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 