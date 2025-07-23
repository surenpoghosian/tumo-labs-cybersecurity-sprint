import React from 'react';
import { Metadata } from 'next';
import { BookOpen, Shield, FileText, Users } from "lucide-react";
import Link from "next/link";
import { fetchPublicTranslations } from '@/lib/publicTranslations';
import type { PublicTranslation } from '@/lib/publicTranslations';

// Always render at request time so we serve fresh data and preserve SEO
export const dynamic = 'force-dynamic';

type Translation = PublicTranslation;

async function getPublicTranslations() {
  return fetchPublicTranslations({ limit: 100 });
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicTranslations();
  
  return {
    title: 'Armenian Cybersecurity Documentation | Translated Technical Docs',
    description: `Access ${data.stats.totalTranslations || 0} translated cybersecurity documents in Armenian. Professional translations of security tools, frameworks, and educational materials.`,
    keywords: [
      'armenian cybersecurity',
      'տեխնիկական թարգմանություն',
      'cybersecurity documentation armenian',
      'security tools armenian',
      'information security armenia',
      'հայերեն կիբեր անվտանգություն'
    ],
    openGraph: {
      title: 'Armenian Cybersecurity Documentation',
      description: 'Professional translations of cybersecurity documentation in Armenian',
      type: 'website',
      siteName: 'Armenian CyberSec Docs'
    },
    alternates: {
      canonical: '/docs'
    }
  };
}

export default async function DocsPage() {
  const { translations, projects, categories, stats } = await fetchPublicTranslations({ limit: 100 });



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  // Group by project for comprehensive project-based directory view
  const groupedByProject = (translations || []).reduce<Record<string, Translation[]>>((acc, translation) => {
    const projectTitle = translation.project.title;
    if (!acc[projectTitle]) {
      acc[projectTitle] = [];
    }
    acc[projectTitle].push(translation);
    return acc;
  }, {});
  
  // Sort translations by date (newest first) for recents section
  const recentTranslations = [...(translations || [])].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  ).slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Armenian Documentation Library</h1>
              <p className="text-gray-600 mt-1">
                Browse all available translations across {projects?.length || 0} projects
              </p>
            </div>
            
            {/* Stats Bar */}
            {stats.totalTranslations > 0 && (
              <div className="flex items-center gap-6 mt-4 md:mt-0">
                <div>
                  <div className="text-lg font-semibold text-orange-600">{stats.totalTranslations}</div>
                  <div className="text-xs text-gray-600">Documents</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-orange-600">{categories?.length}</div>
                  <div className="text-xs text-gray-600">Categories</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-orange-600">
                    {stats.totalWords >= 1000 ? `${Math.floor(stats.totalWords / 1000)}K+` : stats.totalWords.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Words</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters removed */}

        {/* Recent Translations Section */}
        {recentTranslations.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recently Translated</h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
                {recentTranslations.map((translation: Translation) => (
                  <Link 
                    key={translation.id}
                    href={`/docs/${encodeURIComponent(translation.project.title.toLowerCase().replace(/\s+/g, '-'))}/${translation.id}`}
                    className="block w-80 flex-shrink-0"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <div className="flex items-center gap-2 mb-2 text-xs">
                        {getDifficultyBadge(translation.project.difficulty)}
                        <span className="text-gray-500">•</span>
                        <span>{formatDate(translation.completedAt)}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {translation.fileName.replace(/\.(md|rst|txt)$/i, '').replace(/[-_]/g, ' ')}
                      </h3>
                      <div className="text-xs text-gray-600 mt-1 flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        {translation.project.title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Complete Project Directory */}
        {Object.keys(groupedByProject)?.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Projects</h2>
            
            <div className="space-y-6">
              {Object.entries(groupedByProject).map(([projectTitle, projectTranslations]) => {
                const translations = projectTranslations as Translation[];
                const firstTranslation = translations[0];
                const project = firstTranslation.project;
                
                return (
                  <div key={projectTitle} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    {/* Project Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center">
                            <Shield className="h-5 w-5 text-orange-600 mr-2" />
                            {project.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {project.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDifficultyBadge(project.difficulty)}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700">
                            {translations.length} doc{translations.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Files Table */}
                    <div className="p-0">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4 font-medium">Document</th>
                            <th className="text-left py-2 px-4 font-medium">Category</th>
                            <th className="text-left py-2 px-4 font-medium">Words</th>
                            <th className="text-left py-2 px-4 font-medium">Date</th>
                            <th className="text-left py-2 px-4 font-medium">Translator</th>
                          </tr>
                        </thead>
                        <tbody>
                          {translations.map((translation: Translation) => (
                            <tr 
                              key={translation.id} 
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-2 px-4">
                                <Link 
                                  href={`/docs/${encodeURIComponent(project.title.toLowerCase().replace(/\s+/g, '-'))}/${translation.id}`}
                                  className="text-orange-600 hover:text-orange-800 font-medium flex items-center"
                                >
                                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="line-clamp-1">
                                    {translation.fileName.replace(/\.(md|rst|txt)$/i, '').replace(/[-_]/g, ' ')}
                                  </span>
                                </Link>
                              </td>
                              <td className="py-2 px-4">
                                <span className="capitalize">{translation.category?.replace('-', ' ') || '-'}</span>
                              </td>
                              <td className="py-2 px-4 whitespace-nowrap">
                                {translation.wordCount.toLocaleString()}
                              </td>
                              <td className="py-2 px-4 whitespace-nowrap">
                                {formatDate(translation.completedAt)}
                              </td>
                              <td className="py-2 px-4">
                                {translation.translator?.name || 'Community'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden p-8 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Documents Available Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Our community is actively translating cybersecurity documentation into Armenian. 
              Join us to help build this valuable resource, or seed some sample data for testing.
            </p>
            <Link href="/dashboard">
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                Start Translating
              </button>
            </Link>
          </div>
        )}

        {/* Community Section - Blog Style */}
        <div className="mt-20">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">
              Join the Armenian Cybersecurity Community
            </h3>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Help make cybersecurity knowledge accessible to Armenian speakers. Every translation 
              strengthens our community&apos;s digital literacy and security awareness.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <BookOpen className="h-8 w-8 text-orange-200 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Translate</h4>
                <p className="text-sm text-orange-100">
                  Convert security documentation into professional Armenian translations
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Users className="h-8 w-8 text-orange-200 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Collaborate</h4>
                <p className="text-sm text-orange-100">
                  Work with security experts and native speakers for quality assurance
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Shield className="h-8 w-8 text-orange-200 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Secure</h4>
                <p className="text-sm text-orange-100">
                  Contribute to Armenia&apos;s cybersecurity knowledge and digital safety
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard">
                <button className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                  Start Contributing
                </button>
              </Link>
              <Link href="/projects">
                <button className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 rounded-xl font-semibold transition-all duration-200">
                  Explore Projects
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 