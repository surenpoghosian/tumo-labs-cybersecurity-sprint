import { NextResponse } from 'next/server';
import { getTranslationEntries, addTranslationEntry, TranslationMemoryEntry } from '@/lib/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  
  try {
    // Get all entries from Firestore
    let entries = await getTranslationEntries();
    
    // Filter by category if provided
    if (category) {
      entries = entries.filter(entry => entry.category === category);
    }
    
    // Filter by search query if provided
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
        query,
        matchCount: entries.length,
        searchType: query ? 'fuzzy' : 'all'
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
    const body = await request.json();

    const newEntry: Omit<TranslationMemoryEntry, 'id'> = {
      uId: body.uId,
      originalText: body.originalText,
      translatedText: body.translatedText,
      context: body.context || '',
      category: body.category || 'general',
      confidence: body.confidence || 0.9,
      createdBy: 'user-1', // Current user
      createdAt: new Date().toISOString(),
      usageCount: 1
    };
    
    const id = await addTranslationEntry(newEntry);
    
    return NextResponse.json({
      success: true,
      data: { id, ...newEntry },
      message: 'Translation memory entry added successfully'
    });
  } catch (error) {
    console.error('Error adding translation memory entry:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add translation memory entry'
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  
  // For now, just simulate updating usage count
  // In a real implementation, you'd update the Firestore document
  return NextResponse.json({
    success: true,
    data: {
      id: body.id,
      usageCount: (body.usageCount || 0) + 1,
      lastUsed: new Date().toISOString()
    },
    message: 'Translation memory usage updated'
  });
} 