import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile, FirestoreProject, FirestoreUserProfile } from '@/lib/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const firestore = await getFirestore();
    const { id } = await params;

    // Get the file document
    const fileDoc = await firestore.collection('files').doc(id).get();

    if (!fileDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Translation not found'
      }, { status: 404 });
    }

    const fileData = { id: fileDoc.id, ...fileDoc.data() } as FirestoreFile & { id: string };

    // Only return if the translation is approved/accepted and publicly visible
    if (fileData.status !== 'accepted') {
      return NextResponse.json({
        success: false,
        error: 'Translation not yet approved for public viewing'
      }, { status: 404 });
    }

    // Check visibility (default to public for existing approved documents)
    const visibility = fileData.visibility || 'public';
    if (visibility === 'private') {
      return NextResponse.json({
        success: false,
        error: 'This document is not available for public viewing'
      }, { status: 404 });
    }

    // Get project information
    let projectData = null;
    try {
      const projectDoc = await firestore.collection('projects').doc(fileData.projectId).get();
      if (projectDoc.exists) {
        projectData = { id: projectDoc.id, ...projectDoc.data() } as FirestoreProject & { id: string };
      }
    } catch (error) {
      console.log('Could not fetch project data:', error);
      return NextResponse.json({
        success: false,
        error: 'Associated project not found'
      }, { status: 404 });
    }

    if (!projectData) {
      return NextResponse.json({
        success: false,
        error: 'Associated project not found'
      }, { status: 404 });
    }

    // Get translator information (anonymized for public view)
    let translatorData = null;
    if (fileData.assignedTranslatorId) {
      try {
        const translatorDoc = await firestore.collection('userProfiles').doc(fileData.assignedTranslatorId).get();
        if (translatorDoc.exists) {
          const data = translatorDoc.data() as FirestoreUserProfile;
          translatorData = {
            name: data.name || 'Anonymous',
            username: data.username || 'anonymous'
          };
        }
      } catch (error) {
        console.log('Could not fetch translator data:', error);
        // Continue without translator info
      }
    }

    // Get review information if available
    let reviewData = null;
    try {
      const reviewSnapshot = await firestore
        .collection('reviews')
        .where('fileId', '==', id)
        .where('status', '==', 'approved')
        .limit(1)
        .get();

      if (!reviewSnapshot.empty) {
        const reviewDoc = reviewSnapshot.docs[0];
        reviewData = {
          reviewedAt: reviewDoc.data().completedAt,
          reviewedBy: reviewDoc.data().reviewerId
        };
      }
    } catch (error) {
      console.log('Could not fetch review data:', error);
      // Continue without review info
    }

    // Build public translation detail object
    const translationDetail = {
      id: fileData.id,
      fileName: fileData.fileName,
      filePath: fileData.filePath,
      originalText: fileData.originalText,
      translatedText: fileData.translatedText,
      wordCount: fileData.wordCount,
      completedAt: fileData.updatedAt,
      category: projectData.categories?.[0] || 'general',
      project: {
        title: projectData.title,
        description: projectData.description,
        categories: projectData.categories || [],
        difficulty: projectData.difficulty || 1,
        source: projectData.source || '',
      },
      translator: translatorData,
      reviewedAt: reviewData?.reviewedAt,
      reviewedBy: reviewData?.reviewedBy,
    };

    // Generate SEO metadata
    const seoMetadata = {
      title: `${projectData.title} - ${fileData.fileName} | Armenian Translation`,
      description: `Armenian translation of ${fileData.fileName} from ${projectData.title}. ${fileData.wordCount} words professionally translated and reviewed.`,
      keywords: [
        'armenian translation',
        'cybersecurity armenian',
        projectData.title.toLowerCase(),
        fileData.fileName.toLowerCase(),
        ...(projectData.categories || []).map(cat => `${cat} armenian`),
      ].join(', '),
      author: translatorData?.name || 'Armenian CyberSec Docs Community',
      datePublished: fileData.updatedAt,
      wordCount: fileData.wordCount,
      language: 'hy', // Armenian language code
      category: projectData.categories?.[0] || 'cybersecurity'
    };

    return NextResponse.json({
      success: true,
      data: translationDetail,
      meta: {
        seo: seoMetadata,
        lastUpdated: fileData.updatedAt,
        publicUrl: `/translations/${id}`,
        translationsPageUrl: '/translations'
      }
    });

  } catch (error) {
    console.error('Error fetching public translation:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch translation'
    }, { status: 500 });
  }
} 