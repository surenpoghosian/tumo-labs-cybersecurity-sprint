import { NextResponse } from 'next/server';
import { getUserTranslationProjects } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || 'user-1';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const userProjects = getUserTranslationProjects(userId);
  
  return NextResponse.json({
    success: true,
    data: userProjects
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Simulate creating translation
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const mockPRResponse = {
    prUrl: `https://github.com/${body.owner}/${body.repo}/pull/${Math.floor(Math.random() * 1000) + 1000}`,
    prNumber: Math.floor(Math.random() * 1000) + 1000,
    status: 'open',
    createdAt: new Date().toISOString()
  };
  
  return NextResponse.json({
    success: true,
    data: mockPRResponse,
    message: 'Pull request submitted successfully'
  });
} 