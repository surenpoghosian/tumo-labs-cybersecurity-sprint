'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, TranslationProject, Certificate } from "@/data/mockData";
import { BookOpen, Award, Clock, CheckCircle, ArrowRight, Github, Eye, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';

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
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-red-600">Failed to load dashboard data</p>
        </Card>
      </div>
    );
  }

  const { stats, recentProjects, recentCertificates } = dashboardData;
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-orange-600 font-medium">Dashboard</Link>
            <Link href="/projects" className="text-gray-600 hover:text-orange-600">Projects</Link>
            <Link href="/certificates" className="text-gray-600 hover:text-orange-600">Certificates</Link>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1 hover:bg-gray-200 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {authUser?.displayName?.charAt(0) || authUser?.email?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {authUser?.displayName || authUser?.email?.split('@')[0] || 'User'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
              
              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="p-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {authUser?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{authUser?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={async () => {
                        try {
                          await logout();
                          router.push('/');
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                      }}
                      className="w-full flex items-center space-x-2 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {authUser?.displayName}!</h1>
          <p className="text-gray-600">Continue contributing to Armenian cybersecurity education</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.inProgressProjects}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.underReviewProjects}</div>
              <div className="text-sm text-gray-600">Under Review</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.completedProjects}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.totalCertificates}</div>
              <div className="text-sm text-gray-600">Certificates</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Translation Projects</CardTitle>
                <Link href="/projects">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Project {project.id}</h4>
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
                      <p className="text-sm text-gray-600 mb-2">{project.documentPath}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        {project.prUrl && (
                          <a 
                            href={project.prUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 hover:underline flex items-center"
                          >
                            <Github className="h-3 w-3 mr-1" />
                            View PR
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No translation projects yet</p>
                  <Link href="/projects">
                    <Button className="mt-4">Start Your First Project</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Certificates</CardTitle>
                <Link href="/certificates">
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
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
                          Download PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No certificates earned yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Complete translation projects to earn certificates
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/projects">
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  title="Browse available cybersecurity projects to translate"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse CyberSec Projects
                </Button>
              </Link>
              <Link href="/translate">
                <Button 
                  variant="outline" 
                  className="w-full"
                  title="Continue working on your current translation project"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue Translation
                </Button>
              </Link>
              <Link href="/certificates">
                <Button 
                  variant="outline" 
                  className="w-full"
                  title="View and manage your earned certificates"
                >
                  <Award className="mr-2 h-4 w-4" />
                  View Certificates
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Firestore Test Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Translation Memory (Firestore Test)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Original text (e.g., 'security')"
                  className="flex-1 px-3 py-2 border rounded"
                  value={testOriginal}
                  onChange={(e) => setTestOriginal(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Armenian translation"
                  className="flex-1 px-3 py-2 border rounded"
                  value={testTranslated}
                  onChange={(e) => setTestTranslated(e.target.value)}
                />
                <Button onClick={addTestEntry} disabled={addingTest}>
                  {addingTest ? 'Adding...' : 'Add to Firestore'}
                </Button>
              </div>
              
              <div>
                <Button onClick={loadTestEntries} disabled={loadingTest} variant="outline">
                  {loadingTest ? 'Loading...' : 'Load from Firestore'}
                </Button>
              </div>
              
              {testEntries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Entries from Firestore:</h4>
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
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardPageContent />
    </AuthGuard>
  );
} 