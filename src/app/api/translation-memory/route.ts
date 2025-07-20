import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { TranslationMemoryEntry } from '@/lib/firestore';

export async function GET() {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();

    let entries: TranslationMemoryEntry[] = [];

    try {
      const snapshot = await firestore
        .collection('translationMemory')
        .where('createdBy', '==', userId)
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          ...data,
          id: doc.id,
        } as TranslationMemoryEntry);
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log('No translation memory entries found for user:', userId);
      entries = [];
    }

    // Categorize entries for better insights
    const categories = [...new Set(entries.map(e => e.category))];
    const stats = {
      total: entries.length,
      categories: categories.length,
      averageConfidence: entries.length > 0 
        ? entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length 
        : 0,
      mostUsed: entries.length > 0 
        ? entries.reduce((max, e) => e.usageCount > max.usageCount ? e : max, entries[0])
        : null
    };

    return NextResponse.json({
      success: true,
      data: entries,
      meta: {
        ...stats,
        isEmpty: entries.length === 0,
        userId
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error fetching translation memory:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch translation memory',
        success: false,
        data: [],
        meta: {
          total: 0,
          categories: 0,
          averageConfidence: 0,
          mostUsed: null,
          isEmpty: true
        }
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { originalText, translatedText, context, category, confidence } = body;

    // Validate required fields
    if (!originalText || !translatedText) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: originalText and translatedText',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate text fields are not empty
    if (!originalText.trim() || !translatedText.trim()) {
      return NextResponse.json(
        { 
          error: 'Original text and translated text cannot be empty',
          success: false
        },
        { status: 400 }
      );
    }

    // Validate confidence score
    const validatedConfidence = Math.max(0, Math.min(1, confidence || 0.8));

    // Check if this translation pair already exists for the user
    const existingSnapshot = await firestore
      .collection('translationMemory')
      .where('createdBy', '==', userId)
      .where('originalText', '==', originalText.trim())
      .get();

    if (!existingSnapshot.empty) {
      // Update existing entry instead of creating duplicate
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();
      
      await firestore.collection('translationMemory').doc(existingDoc.id).update({
        translatedText: translatedText.trim(),
        context: context?.trim() || existingData.context || '',
        category: category?.trim() || existingData.category || 'general',
        confidence: validatedConfidence,
        usageCount: (existingData.usageCount || 0) + 1,
        lastUsed: new Date().toISOString()
      });

      const updatedDoc = await firestore.collection('translationMemory').doc(existingDoc.id).get();
      
      return NextResponse.json({
        success: true,
        data: {
          id: existingDoc.id,
          ...updatedDoc.data()
        },
        message: 'Translation memory entry updated successfully'
      });
    }

    // Create new entry
    const entryData: Omit<TranslationMemoryEntry, 'id'> = {
      uId: userId,
      originalText: originalText.trim(),
      translatedText: translatedText.trim(),
      context: context?.trim() || '',
      category: category?.trim() || 'general',
      confidence: validatedConfidence,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      usageCount: 1,
      lastUsed: new Date().toISOString()
    };

    const docRef = await firestore.collection('translationMemory').add(entryData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...entryData
      },
      message: 'Translation memory entry created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error creating translation memory entry:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create translation memory entry',
        success: false
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();
    
    const body = await request.json();
    const { id, originalText, translatedText, context, category, confidence } = body;

    if (!id) {
      return NextResponse.json(
        { 
          error: 'Missing entry ID',
          success: false
        },
        { status: 400 }
      );
    }

    // Get the existing entry
    const doc = await firestore.collection('translationMemory').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Translation memory entry not found' }, { status: 404 });
    }

    const data = doc.data();
    
    // Check if user has access
    if (data?.createdBy !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Partial<TranslationMemoryEntry> = {};
    
    if (originalText !== undefined && originalText.trim()) {
      updateData.originalText = originalText.trim();
    }
    if (translatedText !== undefined && translatedText.trim()) {
      updateData.translatedText = translatedText.trim();
    }
    if (context !== undefined) {
      updateData.context = context.trim();
    }
    if (category !== undefined) {
      updateData.category = category.trim() || 'general';
    }
    if (confidence !== undefined) {
      updateData.confidence = Math.max(0, Math.min(1, confidence));
    }

    // Update usage tracking
    updateData.usageCount = (data.usageCount || 0) + 1;
    updateData.lastUsed = new Date().toISOString();

    await firestore.collection('translationMemory').doc(id).update(updateData);

    const updatedDoc = await firestore.collection('translationMemory').doc(id).get();
    const updatedEntry: TranslationMemoryEntry = {
      id,
      ...updatedDoc.data()
    } as TranslationMemoryEntry;

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: 'Translation memory entry updated successfully'
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.error('Error updating translation memory entry:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update translation memory entry',
        success: false
      }, 
      { status: 500 }
    );
  }
} 
