import { NextResponse } from 'next/server';
import { getTranslationMemoryMatches, mockTranslationMemory } from '@/data/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (query) {
    // Get translation suggestions for the query
    const matches = getTranslationMemoryMatches(query);
    
    return NextResponse.json({
      success: true,
      data: matches,
      meta: {
        query,
        matchCount: matches.length,
        searchType: 'fuzzy'
      }
    });
  }
  
  // Return all translation memory entries
  let entries = mockTranslationMemory;
  
  if (category) {
    entries = entries.filter(entry => entry.category === category);
  }
  
  return NextResponse.json({
    success: true,
    data: entries.sort((a, b) => b.usageCount - a.usageCount),
    meta: {
      total: entries.length,
      categories: [...new Set(mockTranslationMemory.map(e => e.category))]
    }
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Simulate adding new translation memory entry
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newEntry = {
    id: `tm-${Date.now()}`,
    originalText: body.originalText,
    translatedText: body.translatedText,
    context: body.context || '',
    category: body.category || 'general',
    confidence: body.confidence || 0.9,
    createdBy: 'user-1', // Current user
    createdAt: new Date().toISOString(),
    usageCount: 1
  };
  
  return NextResponse.json({
    success: true,
    data: newEntry,
    message: 'Translation memory entry added successfully'
  });
}

export async function PUT(request: Request) {
  const body = await request.json();
  
  // Simulate updating translation memory entry usage
  await new Promise(resolve => setTimeout(resolve, 200));
  
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