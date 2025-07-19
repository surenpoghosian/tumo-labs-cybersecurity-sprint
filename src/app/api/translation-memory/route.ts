import { NextResponse } from 'next/server';
import { TranslationMemoryEntry } from '@/lib/firestore';
import { getAuth, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';

// Add admin imports for Firestore operations
async function getFirestore() {
  const admin = await import('firebase-admin');
  return admin.firestore();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');

  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
        data: []
      }, { status: 401 });
    }

    // Verify authentication and get user ID
    let userId: string;
    const firebaseAdminAvailable = await isFirebaseAdminAvailable();
    
    if (firebaseAdminAvailable) {
      try {
        const auth = await getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
        console.log('Authenticated user:', userId);
      } catch (authError) {
        console.error('Token verification failed:', authError);
        return NextResponse.json({
          success: false,
          error: 'Invalid authentication token. Please login again.',
          data: []
        }, { status: 401 });
      }
    } else {
      // Development fallback - you should replace this with proper authentication
      console.warn('Firebase Admin not available - using development mode');
      return NextResponse.json({
        success: false,
        error: 'Authentication service unavailable. Please ensure Firebase Admin is properly configured.',
        data: []
      }, { status: 503 });
    }

    // Get entries using Admin SDK for proper authentication context
    const firestore = await getFirestore();
    const snapshot = await firestore
      .collection('translationMemory')
      .where('createdBy', '==', userId)
      .get();
    
    let entries: TranslationMemoryEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data()
      } as TranslationMemoryEntry);
    });
    
    // Additional client-side filtering by category if provided
    if (category) {
      entries = entries.filter(entry => entry.category === category);
    }
    
    // Additional client-side filtering by search query if provided
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      entries = entries.filter(entry => 
        entry.originalText.toLowerCase().includes(lowercaseQuery) ||
        lowercaseQuery.includes(entry.originalText.toLowerCase())
      );
      // Sort by confidence and limit to 5 results for search
      entries = entries.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    } else {
      // Sort by usage count for general listing
      entries = entries.sort((a, b) => b.usageCount - a.usageCount);
    }
    
    return NextResponse.json({
      success: true,
      data: entries,
      meta: {
        userId,
        query,
        category,
        matchCount: entries.length,
        searchType: query ? 'fuzzy' : category ? 'category' : 'all',
        authMode: 'firebase'
      }
    });
  } catch (error) {
    console.error('Error fetching translation memory:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch translation memory',
      data: []
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
        data: []
      }, { status: 401 });
    }

    // Verify authentication and get user ID
    let userId: string;
    const firebaseAdminAvailable = await isFirebaseAdminAvailable();
    
    if (firebaseAdminAvailable) {
      try {
        const auth = await getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
        console.log('Authenticated user creating entry:', userId);
      } catch (authError) {
        console.error('Token verification failed:', authError);
        return NextResponse.json({
          success: false,
          error: 'Invalid authentication token. Please login again.',
          data: []
        }, { status: 401 });
      }
    } else {
      console.warn('Firebase Admin not available');
      return NextResponse.json({
        success: false,
        error: 'Authentication service unavailable. Please ensure Firebase Admin is properly configured.',
        data: []
      }, { status: 503 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.originalText || !body.translatedText) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: originalText and translatedText are required'
      }, { status: 400 });
    }

    // Create new entry with authenticated user's ID (required by Firestore rules)
    const newEntry: Omit<TranslationMemoryEntry, 'id'> = {
      uId: userId, // MUST match authenticated user for Firestore rules
      originalText: body.originalText.trim(),
      translatedText: body.translatedText.trim(),
      context: body.context?.trim() || '',
      category: body.category || 'general',
      confidence: Math.min(Math.max(body.confidence || 0.9, 0), 1), // Clamp between 0 and 1
      createdBy: userId, // MUST match authenticated user for Firestore rules
      createdAt: new Date().toISOString(),
      usageCount: 1
    };
    
    console.log('Creating entry for user:', userId, newEntry);
    
    // Use Admin SDK directly for proper authentication context
    const firestore = await getFirestore();
    const docRef = await firestore.collection('translationMemory').add(newEntry);
    
    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...newEntry },
      message: 'Translation memory entry added successfully',
      meta: {
        userId,
        authMode: 'firebase'
      }
    });
  } catch (error) {
    console.error('Error adding translation memory entry:', error);
    
    // Check if it's a Firestore permission error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
      return NextResponse.json({
        success: false,
        error: 'Permission denied. You can only create entries for your own account.'
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to add translation memory entry'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.',
        data: []
      }, { status: 401 });
    }

    // Verify authentication and get user ID
    let userId: string;
    const firebaseAdminAvailable = await isFirebaseAdminAvailable();
    
    if (firebaseAdminAvailable) {
      try {
        const auth = await getAuth();
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (authError) {
        console.error('Token verification failed:', authError);
        return NextResponse.json({
          success: false,
          error: 'Invalid authentication token. Please login again.',
          data: []
        }, { status: 401 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Authentication service unavailable. Please ensure Firebase Admin is properly configured.',
        data: []
      }, { status: 503 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Translation memory entry ID is required'
      }, { status: 400 });
    }

    // Use Admin SDK for update operations
    const firestore = await getFirestore();
    const docRef = firestore.collection('translationMemory').doc(body.id);
    
    // Verify the document exists and belongs to the user
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Translation memory entry not found'
      }, { status: 404 });
    }
    
    const docData = doc.data();
    if (docData?.createdBy !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Permission denied. You can only update your own entries.'
      }, { status: 403 });
    }
    
    // Update the document
    const updateData = {
      usageCount: (docData.usageCount || 0) + 1,
      lastUsed: new Date().toISOString()
    };
    
    await docRef.update(updateData);
    
    return NextResponse.json({
      success: true,
      data: {
        id: body.id,
        ...updateData,
        updatedBy: userId
      },
      message: 'Translation memory usage updated',
      meta: {
        userId,
        authMode: 'firebase'
      }
    });
  } catch (error) {
    console.error('Error updating translation memory entry:', error);
    
    // Check if it's a Firestore permission error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
      return NextResponse.json({
        success: false,
        error: 'Permission denied. You can only update your own entries.'
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update translation memory entry'
    }, { status: 500 });
  }
} 
