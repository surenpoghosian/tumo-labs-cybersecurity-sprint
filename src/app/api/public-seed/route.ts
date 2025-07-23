import { NextResponse } from 'next/server';
import { seedExampleData } from '@/lib/seed-example-data';

export async function POST() {
  try {
    // Use a test user ID for seeding public data
    const testUserId = 'test-user-123';
    
    console.log('Starting public data seeding...');
    const result = await seedExampleData(testUserId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sample data created successfully',
        data: {
          projectsCreated: result.data?.projects?.length || 0,
          filesCreated: result.data?.files?.length || 0,
          publicDocuments: result.data?.files?.filter((f: any) => f.visibility === 'public')?.length || 0
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in public seeding:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to seed public data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 