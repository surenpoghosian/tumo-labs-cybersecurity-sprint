'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FirestoreUserProfile, FirestoreProject, FirestoreCertificate, FirestoreFile, TranslationMemoryEntry } from "@/lib/firestore";
import { BookOpen, Award, Clock, CheckCircle, ArrowRight, Github, Eye, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import UnifiedLoader from '@/components/ui/UnifiedLoader';

interface DashboardData {
  user: FirestoreUserProfile;
  stats: {
    totalFiles: number;
    filesInProgress: number;
    filesPending: number;
    totalCertificates: number;
    totalCredits: number;
    wordsTranslated: number;
    approvedTranslations: number;
    rejectedTranslations: number;
  };
  currentFiles: FirestoreFile[];
  recentProjects: FirestoreProject[];
  certificates: FirestoreCertificate[];
  translationMemory: TranslationMemoryEntry[];
  isEmpty: boolean;
}

function DashboardPageContent() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<FirestoreUserProfile | null>(null);
  
  // Firestore test states
  // const [testOriginal, setTestOriginal] = useState('');
  // const [testTranslated, setTestTranslated] = useState('');
  // const [testEntries, setTestEntries] = useState<{id: string, originalText: string, translatedText: string, category: string}[]>([]);
  // const [addingTest, setAddingTest] = useState(false);
  // const [loadingTest, setLoadingTest] = useState(false);
  
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  // Firestore test functions
  // const addTestEntry = async () => {
  //   if (!testOriginal || !testTranslated || !authUser) return;
    
  //   setAddingTest(true);
  //   try {
  //     // Get the user's ID token
  //     const idToken = await authUser.getIdToken();
      
  //     const response = await fetch('/api/translation-memory', {
  //       method: 'POST',
  //       headers: { 
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${idToken}`
  //       },
  //       body: JSON.stringify({
  //         uId: authUser.uid,
  //         originalText: testOriginal,
  //         translatedText: testTranslated,
  //         context: 'test',
  //         category: 'cybersecurity',
  //         confidence: 0.9
  //       })
  //     });
      
  //     if (response.ok) {
  //       setTestOriginal('');
  //       setTestTranslated('');
  //       loadTestEntries(); // Reload entries
  //     }
  //   } catch (error) {
  //     console.error('Error adding test entry:', error);
  //   } finally {
  //     setAddingTest(false);
  //   }
  // };

  // const loadTestEntries = async () => {
  //   setLoadingTest(true);
  //   try {
  //     // Get the user's ID token for GET requests too
  //     const idToken = authUser ? await authUser.getIdToken() : null;
      
  //     const response = await fetch('/api/translation-memory', {
  //       headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {}
  //     });
  //     const data = await response.json();
  //     if (data.success) {
  //       setTestEntries(data.data);
  //     }
  //   } catch (error) {
  //     console.error('Error loading test entries:', error);
  //   } finally {
  //     setLoadingTest(false);
  //   }
  // };

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      try {
        const token = await authUser.getIdToken();
        const response = await fetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setDashboardData(result.data);
        } else {
          console.error('Dashboard API returned error:', result.error);
          setDashboardData(null);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    if (authUser) {
      fetchDashboardData();
    }
  }, [authUser]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) return;
      
      try {
        const idToken = await authUser.getIdToken();
        const response = await fetch('/api/user', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  // Listen in real-time for changes to the user's profile (e.g., approvedTranslations)
  useEffect(() => {
    if (!authUser) return;

    const profileDocRef = doc(db, 'userProfiles', authUser.uid);

    const unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const updatedProfile = docSnap.data() as Partial<FirestoreUserProfile>;

      setDashboardData((prev) => {
        if (!prev) return prev;

        const updatedStats = {
          ...prev.stats,
          approvedTranslations: updatedProfile.approvedTranslations ?? prev.stats.approvedTranslations,
          rejectedTranslations: updatedProfile.rejectedTranslations ?? prev.stats.rejectedTranslations,
          totalCredits: updatedProfile.totalCredits ?? prev.stats.totalCredits,
          wordsTranslated: updatedProfile.totalWordsTranslated ?? prev.stats.wordsTranslated,
          totalCertificates: Array.isArray(updatedProfile.certificates)
            ? updatedProfile.certificates.length
            : prev.stats.totalCertificates,
        };

        return {
          ...prev,
          user: {
            ...prev.user,
            ...updatedProfile,
          } as FirestoreUserProfile,
          stats: updatedStats,
        };
      });
    });

    return () => unsubscribe();
  }, [authUser]);

  const handleDownloadCertificate = async (certificate: FirestoreCertificate) => {
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
      <UnifiedLoader 
        message="Loading dashboard..."
        showHeader={false}
        theme="orange"
      />
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

  const { stats, recentProjects, certificates } = dashboardData;
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
            {(userProfile?.isModerator || userProfile?.role === 'administrator') && (
              <Link href="/moderation" className="text-gray-600 hover:text-orange-600">Moderation</Link>
            )}
            
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
              <div className="text-2xl font-bold text-gray-900">{stats?.totalFiles || 0}</div>
              <div className="text-sm text-gray-600">Total Files</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats?.filesInProgress || 0}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats?.filesPending || 0}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats?.approvedTranslations || 0}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats?.totalCertificates || 0}</div>
              <div className="text-sm text-gray-600">Certificates</div>
            </CardContent>
          </Card>
        </div>

         {/* Quick Actions */}
         <Card className="mt-8 mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 gap-4 ${dashboardData.currentFiles && dashboardData.currentFiles?.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {dashboardData.currentFiles && dashboardData.currentFiles?.length > 0 && (
                <Link href={`/translate/${dashboardData.currentFiles[0].id}`}>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    title="Continue working on your assigned files"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Continue My Work
                  </Button>
                </Link>
              )}
              <Link href="/projects">
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  title="Browse available cybersecurity projects to translate"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse CyberSec Projects
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

        {/* Current Files */}
        {dashboardData.currentFiles && dashboardData.currentFiles?.length > 0 && (
          <Card className="mt-8 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Current Files</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {dashboardData.currentFiles?.length} assigned
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.currentFiles.map((file) => {
                  const getStatusInfo = () => {
                    switch (file.status) {
                      case 'in progress':
                        return { 
                          color: 'orange', 
                          bgColor: 'orange-50', 
                          borderColor: 'orange-200', 
                          label: 'In Progress',
                          canEdit: true,
                          buttonText: 'Continue Translation',
                          buttonColor: 'bg-green-600 hover:bg-green-700'
                        };
                      case 'pending':
                        return { 
                          color: 'yellow', 
                          bgColor: 'yellow-50', 
                          borderColor: 'yellow-200', 
                          label: 'Under Review',
                          canEdit: false,
                          buttonText: 'View Status',
                          buttonColor: 'bg-gray-400 cursor-not-allowed'
                        };
                      case 'rejected':
                        return { 
                          color: 'red', 
                          bgColor: 'red-50', 
                          borderColor: 'red-200', 
                          label: 'Needs Revision',
                          canEdit: true,
                          buttonText: 'Make Revisions',
                          buttonColor: 'bg-red-600 hover:bg-red-700'
                        };
                      case 'accepted':
                        return { 
                          color: 'green', 
                          bgColor: 'green-50', 
                          borderColor: 'green-200', 
                          label: 'Completed',
                          canEdit: false,
                          buttonText: 'View Translation',
                          buttonColor: 'bg-gray-400'
                        };
                      default:
                        return { 
                          color: 'blue', 
                          bgColor: 'blue-50', 
                          borderColor: 'blue-200', 
                          label: 'Available',
                          canEdit: true,
                          buttonText: 'Start Translation',
                          buttonColor: 'bg-blue-600 hover:bg-blue-700'
                        };
                    }
                  };

                  const statusInfo = getStatusInfo();

                  return (
                    <div key={file.id} className={`border rounded-lg p-4 bg-${statusInfo.bgColor} border-${statusInfo.borderColor}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{file.fileName}</h4>
                        <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{file.filePath}</p>
                      
                      {/* Status-specific messages */}
                      {file.status === 'pending' && (
                        <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
                          <strong>Under Review:</strong> Your translation is being reviewed by moderators. You cannot edit until review is complete.
                        </div>
                      )}
                      
                      {file.status === 'rejected' && (
                        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
                          <strong>Needs Revision:</strong> Your translation was reviewed and needs changes. Please make revisions and resubmit.
                        </div>
                      )}

                      {file.status === 'accepted' && (
                        <div className="mb-3 p-2 bg-green-100 border border-green-300 rounded text-xs text-green-800">
                          <strong>Completed:</strong> Your translation has been accepted and published. Great work!
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{file.wordCount} words</span>
                          <span>{file.estimatedHours}h estimated</span>
                        </div>
                        
                        {statusInfo.canEdit ? (
                          <Link href={`/translate/${file.id}`}>
                            <Button size="sm" className={statusInfo.buttonColor}>
                              <ArrowRight className="h-4 w-4 mr-1" />
                              {statusInfo.buttonText}
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" className={statusInfo.buttonColor} disabled>
                            <ArrowRight className="h-4 w-4 mr-1" />
                            {statusInfo.buttonText}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
              {recentProjects?.length && recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{project.title}</h4>
                        <Badge 
                          variant={
                            project.status === 'completed' ? 'default' :
                            project.status === 'in progress' ? 'secondary' :
                            'outline'
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        {project.source && (
                          <a 
                            href={project.source} 
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
              {certificates?.length && certificates.length > 0 ? (
                <div className="space-y-4">
                  {certificates.map((certificate) => (
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
                          {certificate.createdAt ? new Date(certificate.createdAt).toLocaleDateString() : 'N/A'}
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

        {/* Firestore Test Section
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
              
              {testEntries?.length && testEntries.length > 0 && (
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
        </Card> */}
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