import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getAllTranslationProjects, mockUsers, mockCyberSecProjects } from '@/data/mockData';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuthToken();
    const { id } = await params;
    const translationId = id;
    const body = await request.json();
    const { completionNotes, requestCertificate = true } = body;

    // Find the translation project
    const translationProject = getAllTranslationProjects().find(p => p.id === translationId);
    
    if (!translationProject) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Translation project not found',
          code: 'TRANSLATION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Validate user exists
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if user owns this translation
    if (translationProject.assignedTranslatorId !== userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized: You can only submit your own translations',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Check if translation is ready for review
    if (translationProject.status !== 'in-progress') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Translation cannot be submitted for review. Current status: ${translationProject.status}`,
          code: 'INVALID_STATUS',
          details: {
            currentStatus: translationProject.status,
            requiredStatus: 'in-progress'
          }
        },
        { status: 400 }
      );
    }

    // Calculate completion percentage
    const completionPercentage = translationProject.totalSegments > 0 
      ? Math.round((translationProject.completedSegments / translationProject.totalSegments) * 100)
      : 0;
    
    if (completionPercentage < 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Translation must be 100% complete before submission. Current progress: ${completionPercentage}%`,
          code: 'INCOMPLETE_TRANSLATION',
          details: {
            currentProgress: completionPercentage,
            requiredProgress: 100
          }
        },
        { status: 400 }
      );
    }

    // Mock submission process
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a mock review ID
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Find the source project for additional details
    const sourceProject = mockCyberSecProjects.find(p => p.id === translationProject.cyberSecProjectId);
    
    const submissionResult = {
      reviewId,
      submissionId: `sub-${Date.now()}`,
      translationId,
      userId,
      status: 'pending-review',
      submittedAt: new Date().toISOString(),
      estimatedReviewTime: '2-3 business days',
      priority: 'normal', // Default priority since TranslationProject doesn't have priority property
      projectDetails: {
        title: sourceProject?.name || translationProject.documentPath,
        difficulty: sourceProject?.difficulty || 'intermediate',
        wordCount: translationProject.originalContent?.split(' ').length || 0,
        category: sourceProject?.category || 'general'
      },
      reviewerAssignment: {
        assignedReviewer: null, // Will be assigned by system
        expectedAssignmentTime: '1 business day'
      },
      completionNotes: completionNotes || '',
      certificateRequested: requestCertificate,
      nextSteps: [
        'Your translation has been submitted for review',
        'A qualified reviewer will be assigned within 1 business day',
        'Review process typically takes 2-3 business days',
        requestCertificate ? 'Certificate will be issued upon successful review' : 'No certificate requested'
      ]
    };

    return NextResponse.json({
      success: true,
      data: submissionResult,
      message: 'Translation submitted for review successfully'
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Submit review API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during submission',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
} 