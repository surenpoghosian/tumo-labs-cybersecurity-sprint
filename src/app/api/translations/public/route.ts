import { NextResponse } from 'next/server';
import { fetchPublicTranslations } from '@/lib/publicTranslations';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const sortBy = (url.searchParams.get('sortBy') || 'date') as 'date' | 'title' | 'words';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const data = await fetchPublicTranslations({ category, sortBy, limit });
    return NextResponse.json(data);
  } catch (err) {
    console.error('[translations/public] handler error:', err);
    return NextResponse.json(
      {
        translations: [],
        projects: [],
        categories: [],
        stats: { totalTranslations: 0, totalWords: 0 },
      },
      { status: 500 },
    );
  }
} 