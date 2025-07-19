'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, TranslationProject, Certificate } from "@/data/mockData";
import { BookOpen, Award, Github, Eye, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LocalizationDemo } from '@/components/common/LocalizationDemo';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

interface DashboardData {
  user: User;
  stats: {
    totalProjects: number;
    completedProjects: number;
    inProgressProjects: number;
    underReviewProjects: number;
    totalCertificates: number;
  };
  recentProjects: TranslationProject[];
  recentCertificates: Certificate[];
}

function DashboardPageContent() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const tNav = useTranslations('Navigation');
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Firestore test states
  const [testOriginal, setTestOriginal] = useState('');
  const [testTranslated, setTestTranslated] = useState('');
  const [testEntries, setTestEntries] = useState<{id: string, originalText: string, translatedText: string, category: string}[]>([]);
  const [addingTest, setAddingTest] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  // Firestore test functions
  const addTestEntry = async () => {
    if (!testOriginal || !testTranslated || !authUser) return;
    
    setAddingTest(true);
    try {
      // Get the user's ID token
      const idToken = await authUser.getIdToken();
      
      const response = await fetch('/api/translation-memory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uId: authUser.uid,
          originalText: testOriginal,
          translatedText: testTranslated,
          context: 'test',
          category: 'cybersecurity',
          confidence: 0.9
        })
      });
      
      if (response.ok) {
        setTestOriginal('');
        setTestTranslated('');
        loadTestEntries(); // Reload entries
      }
    } catch (error) {
      console.error('Error adding test entry:', error);
    } finally {
      setAddingTest(false);
    }
  };

  const loadTestEntries = async () => {
    setLoadingTest(true);
    try {
      // Get the user's ID token for GET requests too
      const idToken = authUser ? await authUser.getIdToken() : null;
      
      const response = await fetch('/api/translation-memory', {
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setTestEntries(data.data);
      }
    } catch (error) {
      console.error('Error loading test entries:', error);
    } finally {
      setLoadingTest(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/user');
        const result = await response.json();
        setDashboardData(result.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      const filename = `${certificate.id}.pdf`;
      const response = await fetch(`/api/certificates/download/${filename}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificate.verificationCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Error downloading certificate:', err);
      // Could add error handling here if needed
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            {tCommon('refresh')}
          </Button>
        </Card>
      </div>
    );
  }

  const { user, stats, recentProjects, recentCertificates } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-blue-600">{tNav('home')}</Link>
            <Link href="/projects" className="text-gray-600 hover:text-blue-600">{tNav('projects')}</Link>
            <Link href="/certificates" className="text-gray-600 hover:text-blue-600">{tNav('certificates')}</Link>
            <LanguageSwitcher />
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <span>{authUser?.displayName || user.name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <Link 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {tNav('profile')}
                    </Link>
                    <Link 
                      href="/settings" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {tNav('settings')}
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        router.push('/');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {tNav('logout')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('welcome', { name: authUser?.displayName || user.name })}
          </h1>
          <p className="text-gray-600">
            Manage your cybersecurity translation projects and track your progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">{stats.totalProjects}</div>
              <div className="text-sm text-gray-600">{t('stats.totalProjects')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.completedProjects}</div>
              <div className="text-sm text-gray-600">{t('stats.completedProjects')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.inProgressProjects}</div>
              <div className="text-sm text-gray-600">{t('stats.inProgressProjects')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.underReviewProjects}</div>
              <div className="text-sm text-gray-600">{t('stats.underReviewProjects')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{stats.totalCertificates}</div>
              <div className="text-sm text-gray-600">{t('stats.totalCertificates')}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('recentProjects.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Project Translation</h4>
                        <Badge 
                          variant={
                            project.status === 'merged' ? 'default' : 
                            project.status === 'under-review' ? 'secondary' : 
                            'outline'
                          }
                        >
                          {project.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Progress: {project.completedSegments}/{project.totalSegments} segments
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <Link href={`/translate/${project.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            {t('recentProjects.viewDetails')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('recentProjects.noProjects')}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {t('recentProjects.startFirst')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {t('recentCertificates.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentCertificates.length > 0 ? (
                <div className="space-y-4">
                  {recentCertificates.map((certificate) => (
                    <div key={certificate.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{certificate.projectName}</h4>
                        <Badge variant="default">{certificate.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Verification: {certificate.verificationCode}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(certificate.mergedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDownloadCertificate(certificate)}
                          className="text-xs text-orange-600 hover:underline"
                          title="Download certificate PDF"
                        >
                          {t('recentCertificates.downloadPDF')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('recentCertificates.noCertificates')}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {t('recentCertificates.completeProjects')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('quickActions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/projects">
                <Button className="w-full" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t('quickActions.browseProjects')}
                </Button>
              </Link>
              <Link href="/certificates">
                <Button className="w-full" variant="outline">
                  <Award className="h-4 w-4 mr-2" />
                  {t('quickActions.viewCertificates')}
                </Button>
              </Link>
              <Button className="w-full" variant="outline" onClick={loadTestEntries}>
                <Github className="h-4 w-4 mr-2" />
                {t('quickActions.translationMemory')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Translation Memory Test */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('translationMemoryTest.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder={t('translationMemoryTest.originalText')}
                  className="flex-1 px-3 py-2 border rounded"
                  value={testOriginal}
                  onChange={(e) => setTestOriginal(e.target.value)}
                />
                <input
                  type="text"
                  placeholder={t('translationMemoryTest.armenianTranslation')}
                  className="flex-1 px-3 py-2 border rounded"
                  value={testTranslated}
                  onChange={(e) => setTestTranslated(e.target.value)}
                />
                <Button onClick={addTestEntry} disabled={addingTest}>
                  {addingTest ? t('translationMemoryTest.adding') : t('translationMemoryTest.addToFirestore')}
                </Button>
              </div>
              
              <div>
                <Button onClick={loadTestEntries} disabled={loadingTest} variant="outline">
                  {loadingTest ? t('translationMemoryTest.loading') : t('translationMemoryTest.loadFromFirestore')}
                </Button>
              </div>
              
              {testEntries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">{t('translationMemoryTest.entries')}</h4>
                  {testEntries.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 p-2 rounded text-sm">
                      <strong>{entry.originalText}</strong> → {entry.translatedText}
                      <span className="text-gray-500 ml-2">({entry.category})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Localization Demo */}
        <LocalizationDemo />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardPageContent />
    </AuthGuard>
  );
} 