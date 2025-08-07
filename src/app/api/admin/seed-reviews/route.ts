import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';

function isAdmin(userId: string): boolean {
  const allowlist = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return allowlist.includes(userId);
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const userId = await verifyAuthToken(authHeader);
    if (!isAdmin(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const firestore = await getFirestore();
    
    // Create sample review data
    const sampleReviews = [
      {
        uId: userId,
        fileId: 'sample-file-1',
        translationId: 'sample-translation-1',
        reviewerId: '', // Empty - pending assignment
        status: 'pending',
        priority: 'high',
        securityAccuracyScore: null,
        languageQualityScore: null,
        comments: '',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        estimatedReviewTime: 120, // 2 hours
        reviewType: 'translation',
        category: 'cybersecurity',
      },
      {
        uId: userId,
        fileId: 'sample-file-2',
        translationId: 'sample-translation-2',
        reviewerId: '', // Empty - pending assignment
        status: 'pending',
        priority: 'medium',
        securityAccuracyScore: null,
        languageQualityScore: null,
        comments: '',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        estimatedReviewTime: 90,
        reviewType: 'content',
        category: 'documentation',
      },
      {
        uId: userId,
        fileId: 'sample-file-3',
        translationId: 'sample-translation-3',
        reviewerId: '', // Empty - pending assignment
        status: 'pending',
        priority: 'low',
        securityAccuracyScore: null,
        languageQualityScore: null,
        comments: '',
        createdBy: userId,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        estimatedReviewTime: 60,
        reviewType: 'security',
        category: 'vulnerability-assessment',
      }
    ];

    // Also create sample file data that these reviews reference
    const sampleFiles = [
      {
        id: 'sample-file-1',
        uId: userId,
        projectId: 'sample-project-1',
        fileName: 'security-guide.md',
        filePath: 'docs/security-guide.md',
        folderPath: 'docs',
        originalText: 'This is a sample security guide that needs translation review.',
        translatedText: 'Սա նմուշային անվտանգության ուղեցույց է, որը կարիք ունի թարգմանության գնահատման։',
        status: 'pending',
        assignedTranslatorId: userId,
        reviewerId: '',
        translations: [],
        wordCount: 150,
        estimatedHours: 2,
        actualHours: 1.5,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 1500,
      },
      {
        id: 'sample-file-2',
        uId: userId,
        projectId: 'sample-project-1',
        fileName: 'installation.md',
        filePath: 'docs/installation.md',
        folderPath: 'docs',
        originalText: 'Installation guide for the security framework.',
        translatedText: 'Անվտանգության համակարգի տեղադրման ուղեցույց։',
        status: 'pending',
        assignedTranslatorId: userId,
        reviewerId: '',
        translations: [],
        wordCount: 100,
        estimatedHours: 1,
        actualHours: 0.8,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 1000,
      },
      {
        id: 'sample-file-3',
        uId: userId,
        projectId: 'sample-project-1',
        fileName: 'vulnerability-report.md',
        filePath: 'reports/vulnerability-report.md',
        folderPath: 'reports',
        originalText: 'Vulnerability assessment report template.',
        translatedText: 'Խոցելիության գնահատման հաշվետվության կաղապար։',
        status: 'pending',
        assignedTranslatorId: userId,
        reviewerId: '',
        translations: [],
        wordCount: 80,
        estimatedHours: 1,
        actualHours: 0.7,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 800,
      }
    ];

    // Create sample project
    const sampleProject = {
      id: 'sample-project-1',
      uId: userId,
      title: 'Cybersecurity Documentation',
      version: '1.0',
      description: 'Sample cybersecurity documentation project for testing reviews',
      developedBy: 'Security Team',
      difficulty: 2,
      source: 'https://github.com/example/cybersec-docs',
      categories: ['cybersecurity', 'documentation'],
      status: 'in progress',
      files: ['sample-file-1', 'sample-file-2', 'sample-file-3'],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedHours: 4,
      translationProgress: 75,
      availableForTranslation: true,
    };

    // Use batch to create all data
    const batch = firestore.batch();
    
    // Create project
    const projectRef = firestore.collection('projects').doc('sample-project-1');
    batch.set(projectRef, sampleProject);
    
    // Create files
    sampleFiles.forEach((file) => {
      const fileRef = firestore.collection('files').doc(file.id);
      batch.set(fileRef, file);
    });
    
    // Create reviews
    sampleReviews.forEach((review) => {
      const reviewRef = firestore.collection('reviews').doc();
      batch.set(reviewRef, review);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: 'Sample review data created successfully',
      data: {
        reviewsCreated: sampleReviews.length,
        filesCreated: sampleFiles.length,
        projectsCreated: 1,
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error creating sample reviews:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create sample reviews',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 