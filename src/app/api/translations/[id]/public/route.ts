import { NextResponse } from 'next/server';
import { fetchPublicTranslationById } from '@/lib/publicTranslations';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const translation = await fetchPublicTranslationById(id);
    if (!translation) {
      return NextResponse.json({ success: false, error: 'Translation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: translation });
  } catch (err) {
    console.error('[translation detail API] error:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch translation' }, { status: 500 });
  }
} 