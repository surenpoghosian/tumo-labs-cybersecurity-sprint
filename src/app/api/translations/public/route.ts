import { NextResponse } from 'next/server';
import { getFirestore, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

interface PublicTranslation {
  id: string;
  fileName: string;
  filePath: string;
  originalText: string;
  translatedText: string;
  wordCount: number;
  completedAt: string;
  category: string;
  project: {
    title: string;
    description: string;
    categories: string[];
    difficulty: number;
  };
  translator?: {
    name: string;
    username: string;
  } | null;
}

function createEmptyResponse() {
  return NextResponse.json({
    translations: [],
    projects: [],
    categories: [],
    stats: {
      totalTranslations: 0,
      totalWords: 0
    }
  });
}

export async function GET(request: Request) {
  try {
    // Check if Firebase Admin is properly configured
    const firebaseAvailable = await isFirebaseAdminAvailable();
    
    if (!firebaseAvailable) {
      console.warn('Firebase Admin not available - returning empty data');
      return createEmptyResponse();
    }

    // Get Firestore instance with error handling
    let firestore;
    try {
      firestore = await getFirestore();
    } catch (error) {
      console.warn('Failed to get Firestore instance:', error);
      return createEmptyResponse();
    }
    
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const sortBy = url.searchParams.get('sortBy') || 'date';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build and execute query with error handling
    let snapshot;
    try {
      // Simplified query to avoid composite index requirements
      const query = firestore.collection('files')
        .where('status', '==', 'accepted')
        .where('visibility', 'in', ['public', 'unlisted'])
        .limit(limit);

      snapshot = await query.get();
    } catch (error) {
      console.warn('Failed to execute Firestore query:', error);
      return NextResponse.json({
        translations: [],
        projects: [],
        categories: [],
        stats: {
          totalTranslations: 0,
          totalWords: 0
        }
      });
    }
    
    const publicTranslations: PublicTranslation[] = [];

    // Fetch additional data for each translation
    for (const doc of snapshot.docs) {
      try {
        console.log('Processing document:', doc.id);
        const data = doc.data();
        console.log('Document data keys:', Object.keys(data));
        
        // Fetch project data with fallback
        let projectData = null;
        if (data.projectId) {
          try {
            console.log('Fetching project:', data.projectId);
            const projectDoc = await firestore.collection('projects').doc(data.projectId).get();
            if (projectDoc.exists) {
              projectData = projectDoc.data();
              console.log('Project found:', projectData?.title);
            } else {
              console.log('Project not found:', data.projectId);
            }
          } catch (error) {
            console.warn('Failed to fetch project data for:', data.projectId, error);
          }
        } else {
          console.log('No projectId found in document');
        }

        // Fetch translator data with fallback
        let translatorData = null;
        if (data.assignedTranslatorId) {
          try {
            const userDoc = await firestore.collection('users').doc(data.assignedTranslatorId).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              if (userData) {
                translatorData = {
                  name: userData.name || userData.displayName || 'Anonymous Translator',
                  username: userData.username || userData.email || 'anonymous'
                };
              }
            }
          } catch (error) {
            console.warn('Failed to fetch translator data for:', data.assignedTranslatorId, error);
          }
        }

        // Create translation object with fallbacks
        const translation: PublicTranslation = {
          id: doc.id,
          fileName: data.fileName || 'Unknown Document',
          filePath: data.filePath || '',
          originalText: data.originalText || '',
          translatedText: data.translatedText || '',
          wordCount: data.wordCount || 0,
          completedAt: data.publishedAt || data.updatedAt || data.createdAt || new Date().toISOString(),
          category: data.category || projectData?.categories?.[0] || 'cybersecurity',
          project: {
            title: projectData?.title || 'Unknown Project',
            description: projectData?.description || 'Cybersecurity documentation project',
            categories: projectData?.categories || ['cybersecurity'],
            difficulty: projectData?.difficulty || 2
          },
          translator: translatorData
        };

        // Skip if category filter doesn't match
        if (category && category !== 'all') {
          if (translation.category !== category && !translation.project.categories.includes(category)) {
            continue;
          }
        }

        publicTranslations.push(translation);
      } catch (error) {
        console.warn('Failed to process document:', doc.id, error);
        // Continue processing other documents
      }
    }

    // Sort results in memory (since we removed orderBy from query)
    switch (sortBy) {
      case 'words':
        publicTranslations.sort((a, b) => b.wordCount - a.wordCount);
        break;
      case 'title':
        publicTranslations.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      default: // 'date'
        publicTranslations.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        break;
    }

    // Generate metadata
    const totalWords = publicTranslations.reduce((sum, t) => sum + (t.wordCount || 0), 0);
    const categories = [...new Set(publicTranslations.map(t => t.category).filter(Boolean))];
    
    // Extract unique projects from translations
    const projects = [...new Set(publicTranslations.map(t => t.project.title).filter(Boolean))]
      .map(title => {
        const translation = publicTranslations.find(t => t.project.title === title);
        return translation?.project;
      })
      .filter(Boolean);

    // Return format expected by the client
    return NextResponse.json({
      translations: publicTranslations,
      projects: projects,
      categories: categories,
      stats: {
        totalTranslations: publicTranslations.length,
        totalWords: totalWords
      }
    });

  } catch (error) {
    console.error('ERROR in public translations API:', error);
    return NextResponse.json(
      { 
        translations: [],
        projects: [],
        categories: [],
        stats: {
          totalTranslations: 0,
          totalWords: 0
        }
      },
      { status: 500 }
    );
  }
} 