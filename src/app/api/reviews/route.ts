import { NextResponse } from 'next/server';
import { getReviewTasksByReviewerId } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reviewerId = searchParams.get('reviewerId') || 'user-2';
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const reviewTasks = getReviewTasksByReviewerId(reviewerId);
  
  return NextResponse.json({
    success: true,
    data: reviewTasks
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Simulate submitting review
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const newReview = {
    id: `review-${Date.now()}`,
    translationProjectId: body.translationProjectId,
    reviewerId: body.reviewerId,
    status: 'approved' as const,
    securityAccuracyScore: body.securityAccuracyScore,
    languageQualityScore: body.languageQualityScore,
    comments: body.comments,
    createdAt: new Date().toISOString()
  };
  
  return NextResponse.json({
    success: true,
    data: newReview,
    message: 'Review submitted successfully'
  });
} 