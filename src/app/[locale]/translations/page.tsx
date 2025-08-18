/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Search, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Filter,
  Globe,
  Star,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import UnifiedLoader from '@/components/ui/UnifiedLoader';
import AppHeader from '@/components/ui/AppHeader';
import { useTranslations } from 'next-intl';

interface PublicTranslation {
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
  };
}

export default function PublicTranslationsPage() {
  const [translations, setTranslations] = useState<PublicTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'words' | 'title'>('date');
  
  // Translations
  const t = useTranslations('Translations');

  useEffect(() => {
    fetchPublicTranslations();
  }, [selectedCategory, sortBy]);

  const fetchPublicTranslations = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('sortBy', sortBy);

      const response = await fetch(`/api/translations/public?${params.toString()}`);
      
      if (response.ok) {
        const result = await response.json();
        setTranslations(result.data || []);
      } else {
        console.error('Failed to fetch public translations');
        setTranslations([]);
      }
    } catch (error) {
      console.error('Error fetching public translations:', error);
      setTranslations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTranslations = translations.filter(translation => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      translation.fileName.toLowerCase().includes(searchLower) ||
      translation.project.title.toLowerCase().includes(searchLower) ||
      translation.translatedText.toLowerCase().includes(searchLower) ||
      translation.category.toLowerCase().includes(searchLower)
    );
  });

  const categories = [
    { id: 'all', name: 'All Categories', icon: Globe },
    { id: 'web-security', name: 'Web Security', icon: Shield },
    { id: 'network-security', name: 'Network Security', icon: Shield },
    { id: 'pen-testing', name: 'Penetration Testing', icon: Shield },
    { id: 'forensics', name: 'Digital Forensics', icon: Search },
    { id: 'fundamentals', name: 'Fundamentals', icon: BookOpen },
    { id: 'application-security', name: 'App Security', icon: Shield },
  ];

  const getDifficultyBadge = (difficulty: number) => {
    const levels = [t('difficulty.beginner'), t('difficulty.basic'), t('difficulty.intermediate'), t('difficulty.advanced'), t('difficulty.expert')];
    const colors = ['bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800'];
    return (
      <Badge className={colors[difficulty - 1] || colors[2]}>
        {levels[difficulty - 1] || t('difficulty.unknown')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppHeader currentPage="translations" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                <Filter className="h-5 w-5 text-gray-500 mt-2" />
                <select
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'words' | 'title')}
                >
                  <option value="date">{t('sortBy.latest')}</option>
                  <option value="words">{t('sortBy.wordCount')}</option>
                  <option value="title">{t('sortBy.titleAZ')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <UnifiedLoader 
            message={t('loadingTranslations')}
            showHeader={false}
            theme="blue"
          />
        )}

        {/* Translations Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTranslations?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noTranslationsFound')}</h3>
                <p className="text-gray-600">
                  {searchQuery ? t('noTranslationsDescription') : t('noApprovedTranslations')}
                </p>
              </div>
            ) : (
              filteredTranslations.map((translation) => (
                <Card key={translation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2 mb-2">
                          {translation.project.title} - {translation.fileName}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {translation.category}
                          </Badge>
                          {getDifficultyBadge(translation.project.difficulty)}
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {translation.project.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Translation Preview */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">{t('translationPreview')}</h4>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded line-clamp-3">
                          {translation.translatedText.substring(0, 200)}
                          {translation.translatedText?.length > 200 && '...'}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {translation.wordCount} words
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(translation.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {translation.translator && (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {translation.translator.name}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <Link href={`/translations/${translation.id}`}>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            {t('readFullTranslation')}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && filteredTranslations?.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{filteredTranslations?.length}</div>
                  <div className="text-sm text-gray-600">{t('approvedTranslations')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredTranslations.reduce((total, t) => total + t.wordCount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">{t('totalWordsTranslated')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(filteredTranslations.map(t => t.category)).size}
                  </div>
                  <div className="text-sm text-gray-600">{t('categoriesCovered')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 