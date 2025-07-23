import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BookOpen, ArrowLeft, Github } from "lucide-react";
import Link from "next/link";
import { fetchPublicTranslationById, PublicTranslation } from '@/lib/publicTranslations';

// Extend the base type with optional SEO fields that may or may not be present
type ExtendedTranslation = PublicTranslation & {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  project: PublicTranslation['project'] & { source?: string };
};

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    project: string;
    file: string;
  }>;
}

async function getPublicTranslation(fileId: string) {
  try {
    return await fetchPublicTranslationById(fileId);
  } catch (err) {
    console.error('Error fetching translation:', err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { file: fileId } = await params;
  const translation = await getPublicTranslation(fileId) as ExtendedTranslation;
  
  if (!translation) {
    return {
      title: 'Document Not Found | Armenian CyberSec Docs',
      description: 'The requested document was not found or is not available for public viewing.'
    };
  }

  const title = (translation.seoTitle as string | undefined) || `${translation.fileName} - ${translation.project.title} | Armenian Translation`;
  const description = (translation.seoDescription as string | undefined) || 
    `Armenian translation of ${translation.fileName} from ${translation.project.title}. ${translation.project.description.substring(0, 100)}...`;
  
  return {
    title,
    description,
    keywords: [
      ...((translation.seoKeywords as string[] | undefined) || []),
      'armenian cybersecurity',
      'տեխնիկական թարգմանություն',
      translation.category,
      translation.project.title.toLowerCase(),
      'armenian translation',
      'cybersecurity documentation'
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Armenian CyberSec Docs',
      publishedTime: translation.completedAt,
      modifiedTime: translation.completedAt,
      authors: translation.translator ? [translation.translator.name] : undefined,
      section: translation.category
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      canonical: `/docs/${encodeURIComponent(translation.project.title.toLowerCase().replace(/\s+/g, '-'))}/${fileId}`
    },
    other: {
      'article:author': translation.translator?.name || 'Armenian CyberSec Community',
      'article:section': translation.category,
      'article:published_time': translation.completedAt,
      'article:word_count': translation.wordCount.toString()
    }
  };
}

export default async function DocumentPage({ params }: Props) {
  const { file: fileId } = await params;
  const translation = await getPublicTranslation(fileId) as ExtendedTranslation;

  if (!translation) {
    notFound();
  }

  const getDifficultyBadge = (difficulty: number) => {
    const configs = {
      1: { label: 'Beginner', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      2: { label: 'Beginner+', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      3: { label: 'Intermediate', className: 'bg-amber-100 text-amber-700 border-amber-200' },
      4: { label: 'Advanced', className: 'bg-red-100 text-red-700 border-red-200' },
      5: { label: 'Expert', className: 'bg-purple-100 text-purple-700 border-purple-200' },
    };
    
    const config = configs[difficulty as keyof typeof configs] || configs[3];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatReadingTime = (wordCount: number) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": translation.fileName,
    "description": translation.project.description,
    "author": {
      "@type": "Person",
      "name": translation.translator?.name || "Armenian CyberSec Community"
    },
    "datePublished": translation.completedAt,
    "dateModified": translation.completedAt,
    "publisher": {
      "@type": "Organization",
      "name": "Armenian CyberSec Docs",
      "url": process.env.NEXT_PUBLIC_APP_URL
    },
    "inLanguage": "hy-AM",
    "about": {
      "@type": "Thing",
      "name": "Cybersecurity",
      "description": "Information Security and Cybersecurity Documentation"
    },
    "keywords": translation.category,
    "wordCount": translation.wordCount,
    "articleBody": translation.translatedText,
    "isAccessibleForFree": true,
    "license": "https://creativecommons.org/licenses/by-sa/4.0/"
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-orange-600 transition-colors">Home</Link>
              <Link href="/docs" className="text-orange-600 font-medium">Documentation</Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-orange-600 transition-colors">Dashboard</Link>
            </nav>
          </div>
        </header>

        {/* Article Header Section */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <Link href="/docs" className="hover:text-orange-600 transition-colors">Documentation</Link>
              <span>›</span>
              <Link 
                href={`/docs?project=${encodeURIComponent(translation.project.title)}`}
                className="hover:text-orange-600 transition-colors"
              >
                {translation.project.title}
              </Link>
              <span>›</span>
              <span className="text-gray-900">{translation.fileName.replace(/\.(md|rst|txt)$/i, '')}</span>
            </nav>

            {/* Article Header */}
            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {translation.fileName.replace(/\.(md|rst|txt)$/i, '').replace(/[-_]/g, ' ')}
              </h1>
              
              {/* Compact meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {(translation.translator?.name || 'AC').substring(0, 2).toUpperCase()}
                  </div>
                  <span>{translation.translator?.name || 'Armenian CyberSec Community'}</span>
                </div>
                
                <span className="text-gray-400">•</span>
                <span>{formatDate(translation.completedAt)}</span>
                
                <span className="text-gray-400">•</span>
                <span>{formatReadingTime(translation.wordCount)}</span>
                
                {getDifficultyBadge(translation.project.difficulty)}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/docs">
                <button className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Articles
                </button>
              </Link>
              
              {translation.project.source && (
                <a 
                  href={translation.project.source as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  View Source
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Translation Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <article className="mb-12">
            <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
              {translation.translatedText}
            </div>
          </article>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">Help Improve Armenian Cybersecurity Knowledge</h3>
            <p className="text-lg text-orange-100 mb-6 max-w-2xl mx-auto">
              Found this translation helpful? Join our community of translators and security experts 
              to help make more resources available in Armenian.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard">
                <button className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                  Join Translation Community
                </button>
              </Link>
              <Link href="/docs">
                <button className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 rounded-xl font-semibold transition-all duration-200">
                  Read More Articles
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 