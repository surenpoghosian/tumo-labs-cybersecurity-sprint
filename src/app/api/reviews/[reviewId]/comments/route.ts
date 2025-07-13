import { NextResponse } from 'next/server';
import { mockReviewTasks } from '@/data/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { reviewId } = await params;
  const reviewTask = mockReviewTasks.find(task => task.id === reviewId);
  
  if (!reviewTask) {
    return NextResponse.json(
      { success: false, error: 'Review not found' },
      { status: 404 }
    );
  }
  
  const commentStats = {
    total: reviewTask.detailedFeedback.length,
    suggestions: reviewTask.detailedFeedback.filter(c => c.type === 'suggestion').length,
    corrections: reviewTask.detailedFeedback.filter(c => c.type === 'correction').length,
    questions: reviewTask.detailedFeedback.filter(c => c.type === 'question').length,
    resolved: reviewTask.detailedFeedback.filter(c => c.resolved).length,
    highPriority: reviewTask.detailedFeedback.filter(c => c.severity === 'high').length
  };
  
  return NextResponse.json({
    success: true,
    data: reviewTask.detailedFeedback.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    stats: commentStats
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reviewId } = await params;
  const body = await request.json();
  
  // Simulate adding new review comment
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const newComment = {
    id: `comment-${Date.now()}`,
    reviewerId: 'user-2', // Current reviewer
    segmentId: body.segmentId,
    commentText: body.commentText,
    type: body.type || 'suggestion',
    severity: body.severity || 'medium',
    createdAt: new Date().toISOString(),
    resolved: false
  };
  
  return NextResponse.json({
    success: true,
    data: newComment,
    message: 'Review comment added successfully'
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reviewId } = await params;
  const { commentId, action, ...body } = await request.json();
  
  // Handle comment actions
  await new Promise(resolve => setTimeout(resolve, 300));
  
  switch (action) {
    case 'resolve':
      return NextResponse.json({
        success: true,
        data: {
          commentId,
          resolved: true,
          resolvedAt: new Date().toISOString(),
          resolvedBy: 'user-1'
        },
        message: 'Comment marked as resolved'
      });
      
    case 'update':
      return NextResponse.json({
        success: true,
        data: {
          commentId,
          ...body,
          updatedAt: new Date().toISOString()
        },
        message: 'Comment updated successfully'
      });
      
    default:
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
  }
} 