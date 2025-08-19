import React from 'react';
import { Metadata } from 'next';
import { BookOpen, Shield, FileText, Users } from "lucide-react";
import { Link } from '@/i18n/navigation';
import { fetchPublicTranslations } from '@/lib/publicTranslations';
import type { PublicTranslation } from '@/lib/publicTranslations';
import AppHeader from '@/components/ui/AppHeader';
import { getTranslations } from 'next-intl/server';

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
  const docs = await getTranslations('Docs');



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
      <AppHeader currentPage="docs" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Compact Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{docs('title')}</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {docs('subtitle', { count: projects?.length || 0 })}
              </p>
            </div>
            
            {/* Stats Bar */}
            {stats.totalTranslations > 0 && (
              <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-0">
                <div className="text-center">
                  <div className="text-base md:text-lg font-semibold text-orange-600">{stats.totalTranslations}</div>
                  <div className="text-xs text-gray-600">{docs('documents')}</div>
                </div>
                <div className="text-center">
                  <div className="text-base md:text-lg font-semibold text-orange-600">{categories?.length}</div>
                  <div className="text-xs text-gray-600">{docs('categories')}</div>
                </div>
                <div className="text-center">
                  <div className="text-base md:text-lg font-semibold text-orange-600">
                    {stats.totalWords >= 1000 ? `${Math.floor(stats.totalWords / 1000)}K+` : stats.totalWords.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">{docs('words')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters removed */}

        {/* Recent Translations Section */}
        {recentTranslations.length > 0 && (
          <div className="mb-8 md:mb-10">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 px-2 md:px-0">{docs('recentlyTranslated')}</h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 md:gap-4 px-2 md:px-0" style={{ minWidth: 'max-content' }}>
                {recentTranslations.map((translation: Translation) => (
                  <Link 
                    key={translation.id}
                    href={`/docs/${encodeURIComponent(translation.project.title.toLowerCase().replace(/\s+/g, '-'))}/${translation.id}`}
                    className="block w-72 md:w-80 flex-shrink-0"
                  >
                    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 hover:border-orange-300 hover:bg-orange-50 transition-all h-full">
                      <div className="flex items-center gap-2 mb-2 text-xs overflow-x-auto">
                        <div className="flex-shrink-0">
                          {getDifficultyBadge(translation.project.difficulty)}
                        </div>
                        <span className="text-gray-500 flex-shrink-0">•</span>
                        <span className="whitespace-nowrap">{formatDate(translation.completedAt)}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm md:text-base mb-2">
                        {translation.fileName.replace(/\.(md|rst|txt)$/i, '').replace(/[-_]/g, ' ')}
                      </h3>
                      <div className="text-xs text-gray-600 flex items-center">
                        <Shield className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{translation.project.title}</span>
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
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 px-2 md:px-0">{docs('allProjects')}</h2>
            
            <div className="space-y-4 md:space-y-6">
              {Object.entries(groupedByProject).map(([projectTitle, projectTranslations]) => {
                const translations = projectTranslations as Translation[];
                const firstTranslation = translations[0];
                const project = firstTranslation.project;
                
                return (
                  <div key={projectTitle} className="border border-gray-200 rounded-lg bg-white overflow-hidden mx-2 md:mx-0">
                    {/* Project Header */}
                    <div className="bg-gray-50 p-3 md:p-4 border-b border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 flex items-center text-sm md:text-base">
                            <Shield className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mr-2 flex-shrink-0" />
                            <span className="truncate">{project.title}</span>
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getDifficultyBadge(project.difficulty)}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700 whitespace-nowrap">
                            {translations.length} {translations.length !== 1 ? docs('docs') : docs('doc')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Files Table - Horizontal scroll on mobile */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs md:text-sm min-w-[600px]">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 md:px-4 font-medium min-w-[200px]">{docs('document')}</th>
                            <th className="text-left py-2 px-3 md:px-4 font-medium min-w-[100px]">{docs('category')}</th>
                            <th className="text-left py-2 px-3 md:px-4 font-medium min-w-[80px]">{docs('words')}</th>
                            <th className="text-left py-2 px-3 md:px-4 font-medium min-w-[100px]">{docs('date')}</th>
                            <th className="text-left py-2 px-3 md:px-4 font-medium min-w-[120px]">{docs('translator')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {translations.map((translation: Translation) => (
                            <tr 
                              key={translation.id} 
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-2 px-3 md:px-4">
                                <Link 
                                  href={`/docs/${encodeURIComponent(project.title.toLowerCase().replace(/\s+/g, '-'))}/${translation.id}`}
                                  className="text-orange-600 hover:text-orange-800 font-medium flex items-center"
                                >
                                  <FileText className="h-3 w-3 md:h-4 md:w-4 mr-2 flex-shrink-0" />
                                  <span className="line-clamp-2 leading-tight">
                                    {translation.fileName.replace(/\.(md|rst|txt)$/i, '').replace(/[-_]/g, ' ')}
                                  </span>
                                </Link>
                              </td>
                              <td className="py-2 px-3 md:px-4">
                                <span className="capitalize whitespace-nowrap">{translation.category?.replace('-', ' ') || '-'}</span>
                              </td>
                              <td className="py-2 px-3 md:px-4 whitespace-nowrap">
                                {translation.wordCount.toLocaleString()}
                              </td>
                              <td className="py-2 px-3 md:px-4 whitespace-nowrap">
                                <span className="hidden md:inline">{formatDate(translation.completedAt)}</span>
                                <span className="md:hidden">{new Date(translation.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </td>
                              <td className="py-2 px-3 md:px-4">
                                <span className="truncate block max-w-[100px]">{translation.translator?.name || docs('community')}</span>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">{docs('noDocumentsTitle')}</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {docs('noDocumentsDescription')}
            </p>
            <Link href="/dashboard">
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                {docs('startTranslating')}
              </button>
            </Link>
          </div>
        )}

        {/* Community Section - Blog Style */}
        <div className="mt-20">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">
              {docs('communityTitle')}
            </h3>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              {docs('communityDescription')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <BookOpen className="h-8 w-8 text-orange-200 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">{docs('translate')}</h4>
                <p className="text-sm text-orange-100">
                  {docs('translateDescription')}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Users className="h-8 w-8 text-orange-200 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">{docs('collaborate')}</h4>
                <p className="text-sm text-orange-100">
                  {docs('collaborateDescription')}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <Shield className="h-8 w-8 text-orange-200 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">{docs("secure")}</h4>
                <p className="text-sm text-orange-100">
                  {docs("secureDescription")}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard">
                <button className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
                  {docs("startContributing")}
                </button>
              </Link>
              <Link href="/projects">
                <button className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 rounded-xl font-semibold transition-all duration-200">
                  {docs("exploreProjects")}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 