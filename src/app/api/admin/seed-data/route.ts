import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { seedExampleData, clearExampleData } from '@/lib/seed-example-data';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    const body = await request.json();
    const { action = 'seed' } = body; // 'seed' or 'clear'

    if (action === 'clear') {
      const result = await clearExampleData(userId);
      return NextResponse.json(result);
    } else {
      const result = await seedExampleData(userId);
      return NextResponse.json(result);
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error in seed data API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 