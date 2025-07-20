import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebaseAdmin';
import { FirestoreFile, FirestoreProject, FirestoreUserProfile } from '@/lib/firestore';

export async function GET(request: Request) {
  try {
    const firestore = await getFirestore();
    const url = new URL(request.url);
    
    const category = url.searchParams.get('category');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build query for approved translations only
    let query = firestore.collection('files')
      .where('status', '==', 'accepted')
      .limit(limit);

    // Add category filter if specified
    if (category && category !== 'all') {
      // We'll need to filter by project category, so we'll fetch all and filter client-side
      // For better performance, consider adding a category field to files collection
    }

    // Add sorting
    switch (sortBy) {
      case 'words':
        query = query.orderBy('wordCount', 'desc');
        break;
      case 'title':
        query = query.orderBy('fileName', 'asc');
        break;
      default: // 'date'
        query = query.orderBy('updatedAt', 'desc');
        break;
    }

    const snapshot = await query.get();
    const publicTranslations = [];

    // Fetch additional data for each translation
    for (const doc of snapshot.docs) {
      const fileData = { id: doc.id, ...doc.data() } as FirestoreFile & { id: string };
      
      // Get project information
      let projectData = null;
      try {
        const projectDoc = await firestore.collection('projects').doc(fileData.projectId).get();
        if (projectDoc.exists) {
          projectData = { id: projectDoc.id, ...projectDoc.data() } as FirestoreProject & { id: string };
        }
      } catch (error) {
        console.log('Could not fetch project data:', error);
        continue; // Skip this translation if we can't get project data
      }

      // Skip if category filter doesn't match
      if (category && category !== 'all' && projectData) {
        if (!projectData.categories?.includes(category)) {
          continue;
        }
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

      // Build public translation object
      const publicTranslation = {
        id: fileData.id,
        fileName: fileData.fileName,
        filePath: fileData.filePath,
        originalText: fileData.originalText,
        translatedText: fileData.translatedText,
        wordCount: fileData.wordCount,
        completedAt: fileData.updatedAt,
        category: projectData?.categories?.[0] || 'general',
        project: {
          title: projectData?.title || 'Unknown Project',
          description: projectData?.description || '',
          categories: projectData?.categories || [],
          difficulty: projectData?.difficulty || 1,
        },
        translator: translatorData
      };

      publicTranslations.push(publicTranslation);
    }

    // Client-side sorting if needed (since Firestore has limitations on compound queries)
    if (sortBy === 'title') {
      publicTranslations.sort((a, b) => 
        `${a.project.title} - ${a.fileName}`.localeCompare(`${b.project.title} - ${b.fileName}`)
      );
    }

    // Generate SEO metadata
    const totalWords = publicTranslations.reduce((sum, t) => sum + t.wordCount, 0);
    const categories = [...new Set(publicTranslations.map(t => t.category))];

    return NextResponse.json({
      success: true,
      data: publicTranslations,
      meta: {
        total: publicTranslations.length,
        totalWords,
        categories: categories.length,
        availableCategories: categories,
        lastUpdated: new Date().toISOString(),
        // SEO metadata
        seo: {
          title: `Armenian Cybersecurity Translations - ${totalWords.toLocaleString()} Words Translated`,
          description: `Access ${publicTranslations.length} professionally translated cybersecurity documents in Armenian covering ${categories.join(', ')}.`,
          keywords: [
            'armenian cybersecurity',
            'security documentation',
            'armenian translations',
            'cyber security armenian',
            ...categories.map(cat => `${cat} armenian`),
          ].join(', ')
        }
      }
    });

  } catch (error) {
    console.error('Error fetching public translations:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch public translations',
        data: []
      }, 
      { status: 500 }
    );
  }
} 