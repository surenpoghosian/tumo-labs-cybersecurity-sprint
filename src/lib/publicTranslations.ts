/*
 * Shared helper to collect public translations.
 *
 * – Server-side only (can run in Route Handlers and Server Components)
 * – First attempts Firebase Admin for privileged & efficient access.
 * – If Admin is not configured (e.g. prod env missing service account)
 *   it falls back to the public Firestore REST API – still server-side –
 *   so pages stay SEO-friendly and publicly accessible.
 */

import { isFirebaseAdminAvailable, getFirestore } from '@/lib/firebaseAdmin';
import type { Firestore } from 'firebase-admin/firestore';

export interface PublicTranslation {
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

export interface PublicTranslationsResponse {
  translations: PublicTranslation[];
  projects: PublicTranslation['project'][];
  categories: string[];
  stats: {
    totalTranslations: number;
    totalWords: number;
  };
}

export interface FetchOptions {
  limit?: number;
  category?: string | null;
  sortBy?: 'date' | 'title' | 'words';
}

function emptyResponse(): PublicTranslationsResponse {
  return {
    translations: [],
    projects: [],
    categories: [],
    stats: {
      totalTranslations: 0,
      totalWords: 0,
    },
  };
}

async function queryWithAdmin(db: Firestore, opts: Required<FetchOptions>): Promise<PublicTranslationsResponse> {
  const { limit, category, sortBy } = opts;

  // Build Firestore query (no orderBy to avoid composite index requirement)
  const snapshot = await db
    .collection('files')
    .where('status', '==', 'accepted')
    .where('visibility', 'in', ['public', 'unlisted'])
    .limit(limit)
    .get();

  const translations: PublicTranslation[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Category filter (after fetch, for simplicity & index-free)
    if (category && category !== 'all') {
      const cat = data.category || null;
      if (cat !== category && !(data.projectCategories ?? []).includes(category)) {
        continue;
      }
    }

    // Project document (may not exist)
    let project: any = null;
    if (data.projectId) {
      const pDoc = await db.collection('projects').doc(data.projectId).get();
      if (pDoc.exists) project = pDoc.data();
    }

    // Translator profile (optional)
    let translator: PublicTranslation['translator'] = null;
    if (data.assignedTranslatorId) {
      const uDoc = await db.collection('userProfiles').doc(data.assignedTranslatorId).get();
      if (uDoc.exists) {
        const u = uDoc.data() as any;
        translator = {
          name: u.name || u.displayName || 'Anonymous Translator',
          username: u.username || u.email || 'anonymous',
        };
      }
    }

    translations.push({
      id: doc.id,
      fileName: data.fileName || 'Unknown Document',
      filePath: data.filePath || '',
      originalText: data.originalText || '',
      translatedText: data.translatedText || '',
      wordCount: data.wordCount || 0,
      completedAt: data.publishedAt || data.updatedAt || data.createdAt || new Date().toISOString(),
      category: data.category || project?.categories?.[0] || 'general',
      project: {
        title: project?.title || 'Unknown Project',
        description: project?.description || '',
        categories: project?.categories || [],
        difficulty: project?.difficulty || 1,
      },
      translator,
    });
  }

  // Sort in memory
  switch (sortBy) {
    case 'words':
      translations.sort((a, b) => b.wordCount - a.wordCount);
      break;
    case 'title':
      translations.sort((a, b) => a.fileName.localeCompare(b.fileName));
      break;
    default:
      translations.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  const totalWords = translations.reduce((sum, t) => sum + (t.wordCount || 0), 0);
  const categories = [...new Set(translations.map((t) => t.category).filter(Boolean))];
  const projects = [
    ...new Map(translations.map((t) => [t.project.title, t.project])).values(),
  ];

  return {
    translations,
    projects,
    categories,
    stats: {
      totalTranslations: translations.length,
      totalWords,
    },
  };
}

async function queryViaRest(opts: Required<FetchOptions>): Promise<PublicTranslationsResponse> {
  const { projectId, apiKey } = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  };

  if (!projectId || !apiKey) {
    console.warn('[publicTranslations] REST fallback unavailable – missing NEXT_PUBLIC_FIREBASE_* vars');
    return emptyResponse();
  }

  const runQueryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

  const body = {
    structuredQuery: {
      from: [{ collectionId: 'files' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'status' },
                op: 'EQUAL',
                value: { stringValue: 'accepted' },
              },
            },
            {
              fieldFilter: {
                field: { fieldPath: 'visibility' },
                op: 'IN',
                value: {
                  arrayValue: {
                    values: [{ stringValue: 'public' }, { stringValue: 'unlisted' }],
                  },
                },
              },
            },
          ],
        },
      },
      limit: opts.limit,
    },
  };

  try {
    const res = await fetch(runQueryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Ensure we don’t cache because Firestore data is live
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('[publicTranslations] REST query failed:', res.status, res.statusText);
      return emptyResponse();
    }

    const json = (await res.json()) as any[];

    const docs = json
      .filter((r) => r.document)
      .map((r) => ({
        id: r.document.name.split('/').pop() as string,
        data: r.document.fields,
      }));

    // Helper to convert Firestore REST field value to JS value
    const v = (f: any) =>
      f?.stringValue ??
      f?.integerValue && Number(f.integerValue) ??
      f?.doubleValue ??
      (f?.arrayValue ? (f.arrayValue.values || []).map(v) : undefined);

    const translations: PublicTranslation[] = [];

    for (const { id, data } of docs) {
      // Category filter (after fetch)
      const cat = v(data.category) as string | undefined;
      if (opts.category && opts.category !== 'all') {
        if (cat !== opts.category) continue;
      }

      translations.push({
        id,
        fileName: v(data.fileName) || 'Unknown',
        filePath: v(data.filePath) || '',
        originalText: v(data.originalText) || '',
        translatedText: v(data.translatedText) || '',
        wordCount: Number(v(data.wordCount) || 0),
        completedAt: v(data.publishedAt) || v(data.updatedAt) || v(data.createdAt) || new Date().toISOString(),
        category: cat || 'general',
        project: {
          title: v(data.projectTitle) || 'Unknown Project',
          description: v(data.projectDescription) || '',
          categories: v(data.projectCategories) || [],
          difficulty: Number(v(data.projectDifficulty) || 1),
        },
        translator: null, // translator data requires extra queries; omit in REST fallback
      });
    }

    // Basic sort
    switch (opts.sortBy) {
      case 'words':
        translations.sort((a, b) => b.wordCount - a.wordCount);
        break;
      case 'title':
        translations.sort((a, b) => a.fileName.localeCompare(b.fileName));
        break;
      default:
        translations.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    }

    const totalWords = translations.reduce((sum, t) => sum + (t.wordCount || 0), 0);
    const categories = [...new Set(translations.map((t) => t.category).filter(Boolean))];
    const projects = [
      ...new Map(translations.map((t) => [t.project.title, t.project])).values(),
    ];

    return {
      translations,
      projects,
      categories,
      stats: {
        totalTranslations: translations.length,
        totalWords,
      },
    };
  } catch (err) {
    console.error('[publicTranslations] REST query threw:', err);
    return emptyResponse();
  }
}

export async function fetchPublicTranslations({ limit = 50, category = null, sortBy = 'date' }: FetchOptions = {}): Promise<PublicTranslationsResponse> {
  const opts: Required<FetchOptions> = { limit, category, sortBy } as const;

  const adminOK = await isFirebaseAdminAvailable();
  if (adminOK) {
    try {
      const db = await getFirestore();
      return await queryWithAdmin(db, opts);
    } catch (err) {
      console.error('[publicTranslations] Admin path failed, falling back:', err);
    }
  }

  // Fall back to REST (public-READ only)
  return await queryViaRest(opts);
} 