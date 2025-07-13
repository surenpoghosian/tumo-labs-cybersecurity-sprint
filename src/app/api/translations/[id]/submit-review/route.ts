import { NextResponse } from 'next/server';
import { getAllTranslationProjects, mockUsers, mockCyberSecProjects } from '@/data/mockData';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const translationId = id;
    const body = await request.json();
    const { userId, completionNotes, requestCertificate = true } = body;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const notes = completionNotes;

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

    // Simulate review submission processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update translation project status
    translationProject.status = 'under-review';
    
    // Get the related cyber security project to build PR URL
    const cyberSecProject = mockCyberSecProjects.find(p => p.id === translationProject.cyberSecProjectId);
    const repoName = cyberSecProject ? cyberSecProject.name.toLowerCase().replace(/\s+/g, '-') : 'unknown-repo';

    // Generate a mock GitHub PR URL (in real app, this would integrate with GitHub API)
    const prNumber = Math.floor(Math.random() * 1000) + 100;
    const prUrl = `https://github.com/armenian-cybersec/${repoName}/pull/${prNumber}`;
    translationProject.prUrl = prUrl;

    // Simulate review assignment (assign to a random moderator)
    const moderators = mockUsers.filter(u => u.isModerator);
    if (moderators.length > 0) {
      const assignedReviewer = moderators[Math.floor(Math.random() * moderators.length)];
      translationProject.reviewerId = assignedReviewer.id;
    }

    // Create a review task
    const reviewTask = {
      id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      translationProjectId: translationId,
      reviewerId: translationProject.reviewerId || 'user-2',
      status: 'pending' as const,
      priority: 'medium' as const,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      estimatedReviewTime: translationProject.estimatedHours || 2,
      reviewType: 'translation' as const,
      category: 'cybersecurity'
    };

    // In a real app, this would be saved to database
    console.log('Created review task:', reviewTask);

    // Prepare response with next steps
    const response = {
      success: true,
      data: {
        translationProject: {
          id: translationProject.id,
          status: translationProject.status,
          submittedAt: new Date().toISOString(),
          prUrl: translationProject.prUrl,
          assignedReviewer: moderators.find(m => m.id === translationProject.reviewerId)?.name || 'Unassigned'
        },
        reviewTask: {
          id: reviewTask.id,
          estimatedReviewTime: reviewTask.estimatedReviewTime,
          dueDate: reviewTask.dueDate,
          priority: reviewTask.priority
        },
        nextSteps: {
          trackProgress: `/translate/${translationId}`,
          viewPR: prUrl,
          certificateEligible: requestCertificate,
          estimatedCompletionTime: '3-7 business days'
        }
      },
      message: 'Translation successfully submitted for review',
      actions: {
        viewTranslation: `/translate/${translationId}`,
        viewPR: prUrl,
        trackReview: `/dashboard`,
        browseCertificates: `/certificates`
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Submit for review error:', error);
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