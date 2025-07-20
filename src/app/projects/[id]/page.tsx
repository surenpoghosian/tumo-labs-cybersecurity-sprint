/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Github, 
  ArrowLeft, 
  Clock, 
  AlertCircle, 
  Users,
  FileText,
  Zap,
  RefreshCw,
  Play,
  CheckCircle,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import { FirestoreProject, FirestoreFile } from '@/lib/firestore';
import { FolderBrowser } from '@/components/projects/FolderBrowser';
import { ProjectSync } from '@/components/projects/ProjectSync';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectDetailData extends FirestoreProject {
  projectFiles: FirestoreFile[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FirestoreFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      fetchProject();
    }
  }, [params.id, user]);

  const fetchProject = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/projects/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Project not found. The project may have been removed or the link is incorrect.');
        } else {
          setError('Failed to load project. Please try again later.');
        }
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setProject(result.data);
        setError(null);
        
        // Auto-select file with priority: assigned to user > available > any file
        if (result.data.projectFiles && result.data.projectFiles.length > 0) {
          // First priority: files assigned to the current user
          const myAssignedFile = result.data.projectFiles.find((f: FirestoreFile) => 
            f.assignedTranslatorId === user?.uid
          );
          
          if (myAssignedFile) {
            setSelectedFile(myAssignedFile);
          } else {
            // Second priority: truly available files (not taken and no assigned translator)
            const availableFiles = result.data.projectFiles.filter((f: FirestoreFile) => 
              f.status === 'not taken' && !f.assignedTranslatorId
            );
            
            if (availableFiles.length > 0) {
              setSelectedFile(availableFiles[0]);
            } else {
              // Fallback: first file in the list (might not be available)
              setSelectedFile(result.data.projectFiles[0]);
            }
          }
        }
      } else {
        setError('Project not found or invalid project data.');
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: FirestoreFile) => {
    setSelectedFile(file);
  };

  const handleStartTranslation = async () => {
    if (!selectedFile) return;

    try {
      // Navigate directly to the translation page with the existing file ID
      router.push(`/translate/${selectedFile.id}`);
    } catch (error) {
      console.error('Error starting translation:', error);
      alert('Error starting translation. Please try again.');
    }
  };

  const handleTakeFile = async () => {
    if (!selectedFile || !user) return;

    try {
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/files/${selectedFile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'in progress',
          assignedTranslatorId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Immediately redirect to translation page after successful assignment
        router.push(`/translate/${selectedFile.id}`);
      } else {
        console.error('Failed to take file:', result.error);
        if (response.status === 403) {
          alert('Access denied: This file may already be assigned to another translator or you do not have permission to take it.');
        } else if (response.status === 404) {
          alert('File not found. It may have been removed.');
        } else {
          alert(`Failed to assign file: ${result.error || 'Unknown error'}`);
        }
        // Refresh project data to get latest file statuses
        fetchProject();
      }
    } catch (error) {
      console.error('Error taking file:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  const handleSyncComplete = () => {
    fetchProject(); // Refresh project data after sync
  };

  const handleSeedData = async () => {
    if (!user) return;
    
    setIsSeeding(true);
    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'seed' }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Example data created successfully!');
        // Refresh the page to show new data
        window.location.reload();
      } else {
        alert(`Failed to create example data: ${result.message}`);
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error creating example data');
    } finally {
      setIsSeeding(false);
    }
  };

  const getDifficultyBadge = (difficulty: number) => {
    const configs = {
      1: { label: 'Beginner', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      2: { label: 'Beginner+', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      3: { label: 'Intermediate', variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800' },
      4: { label: 'Advanced', variant: 'default' as const, className: 'bg-red-100 text-red-800' },
      5: { label: 'Expert', variant: 'default' as const, className: 'bg-red-100 text-red-800' },
    };
    
    const config = configs[difficulty as keyof typeof configs] || configs[3];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getFileActionButton = () => {
    if (!selectedFile || !user) return null;

    // Available files can be taken
    if (selectedFile.status === 'not taken') {
      return (
        <Button onClick={handleTakeFile} className="bg-orange-600 hover:bg-orange-700">
          <Users className="h-4 w-4 mr-2" />
          Take This File
        </Button>
      );
    }

    // Files assigned to current user
    if (selectedFile.assignedTranslatorId === user.uid) {
      if (selectedFile.status === 'in progress') {
        return (
          <Button onClick={handleStartTranslation} className="bg-green-600 hover:bg-green-700">
            <Play className="h-4 w-4 mr-2" />
            Continue Translation
          </Button>
        );
      }

      if (selectedFile.status === 'pending') {
        return (
          <div className="space-y-2">
            <Button disabled variant="outline" className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Under Review
            </Button>
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Review in Progress:</strong> Your translation is being reviewed by moderators. 
              You cannot edit until the review is complete.
            </div>
          </div>
        );
      }

      if (selectedFile.status === 'rejected') {
        return (
          <div className="space-y-2">
            <Button onClick={handleStartTranslation} className="bg-red-600 hover:bg-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              Make Revisions
            </Button>
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              <strong>Needs Revision:</strong> Your translation was reviewed and needs changes. 
              Please make revisions and resubmit.
            </div>
          </div>
        );
      }

      if (selectedFile.status === 'accepted') {
        return (
          <div className="space-y-2">
            <Button disabled variant="outline" className="w-full">
              <CheckCircle className="h-4 w-4 mr-2" />
              Translation Completed
            </Button>
            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
              <strong>Completed:</strong> Your translation has been accepted and published. Great work!
            </div>
          </div>
        );
      }
    }

    // Files assigned to someone else or other statuses
    return (
      <div className="space-y-2">
        <Button disabled variant="outline" className="w-full">
          <Users className="h-4 w-4 mr-2" />
          {selectedFile.status === 'in progress' ? 'In Progress by Another User' : 
           selectedFile.status === 'pending' ? 'Under Review by Another User' :
           selectedFile.status === 'accepted' ? 'Already Completed' :
           selectedFile.status === 'rejected' ? 'Needs Revision by Assigned User' :
           'Not Available'}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          Status: {selectedFile.status}
          {selectedFile.assignedTranslatorId && selectedFile.assignedTranslatorId !== user.uid && 
            ' • Assigned to another translator'}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-red-600 mb-4">{error}</p>
          
          {/* Show seed data button if no projects exist */}
          {error?.includes('not found') && (
            <div className="space-y-3">
              <Button 
                onClick={handleSeedData} 
                disabled={isSeeding}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSeeding ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Create Example Data for Testing
              </Button>
              <p className="text-sm text-gray-600">
                This will create sample projects and files for testing the translation system.
              </p>
            </div>
          )}
          
          <Link href="/projects">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isProjectAdmin = project.createdBy === user?.uid;
  const hasFiles = project.projectFiles && project.projectFiles.length > 0;

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
            <Link href="/dashboard" className="text-gray-600 hover:text-orange-600">Dashboard</Link>
            <Link href="/projects" className="text-orange-600 font-medium">Projects</Link>
            <Link href="/certificates" className="text-gray-600 hover:text-orange-600">Certificates</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/projects" className="text-orange-600 hover:underline flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </div>

        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              
              <div className="flex items-center gap-4 flex-wrap">
                {getDifficultyBadge(project.difficulty)}
                <Badge variant="outline">v{project.version}</Badge>
                <Badge variant="outline">{project.developedBy}</Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {project.estimatedHours}h estimated
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href={project.source} target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  View Repository
                </a>
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {hasFiles ? project.projectFiles.length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {hasFiles ? project.projectFiles.filter(f => f.status === 'not taken').length : 0}
                  </div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {hasFiles ? project.projectFiles.filter(f => f.status === 'in progress').length : 0}
                  </div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {hasFiles ? Math.round((project.projectFiles.filter(f => f.status === 'accepted').length / project.projectFiles.length) * 100) || 0 : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
            
            {/* Debug Information */}
            {hasFiles && (
              <details className="mt-4 bg-gray-50 rounded-lg group">
                <summary className="cursor-pointer p-3 select-none text-sm font-medium text-gray-700 flex items-center justify-between">
                  <span>File Statuses ({project.projectFiles.length})</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="p-3 pt-0 text-xs space-y-1">
                  {project.projectFiles.map((file) => (
                    <div key={file.id} className="flex justify-between">
                      <span className="truncate max-w-xs">{file.fileName}</span>
                      <span className={`font-medium ${
                        file.status === 'not taken' ? 'text-green-600' : 
                        file.status === 'in progress' ? 'text-orange-600' : 
                        'text-gray-600'
                      }`}>
                        {file.status}
                        {file.assignedTranslatorId && file.assignedTranslatorId !== user?.uid && ' (other user)'}
                        {file.assignedTranslatorId === user?.uid && ' (YOU)'}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Browser */}
          <div className="lg:col-span-2">
            {hasFiles ? (
              <div className="space-y-4">
                {/* Show notice if no files are available */}
                {/* {project.projectFiles.filter(f => f.status === 'not taken').length === 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <h4 className="font-medium text-orange-900">All files are currently assigned</h4>
                          <p className="text-sm text-orange-700">
                            All files in this project are being worked on. You can view the progress below or try another project.
                          </p>
                          {user && (
                            <Button 
                              onClick={handleSeedData} 
                              disabled={isSeeding}
                              size="sm"
                              className="mt-2 bg-orange-600 hover:bg-orange-700"
                            >
                              {isSeeding ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Zap className="h-4 w-4 mr-2" />
                              )}
                              Create Available Test Files
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )} */}
                
                <FolderBrowser
                  files={project.projectFiles}
                  onFileSelect={handleFileSelect}
                  selectedFileId={selectedFile?.id}
                  showFileStats={true}
                  allowFileActions={true}
                />
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Files Found</h3>
                  <p className="text-gray-600 mb-4">
                    This project doesn`t have any documentation files yet.
                  </p>
                  {isProjectAdmin && (
                    <div className="space-y-3">
                      <p className="text-sm text-blue-600">
                        Use the Repository Sync below to import documents from GitHub.
                      </p>
                      <Button 
                        onClick={handleSeedData} 
                        disabled={isSeeding}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSeeding ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Add Sample Files for Testing
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected File Details */}
            {selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Selected File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedFile.fileName}</h4>
                    <p className="text-sm text-gray-500">{selectedFile.filePath}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Word Count:</span>
                      <span className="font-medium">{selectedFile.wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Time:</span>
                      <span className="font-medium">{selectedFile.estimatedHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={selectedFile.status === 'not taken' ? 'secondary' : 'default'}>
                        {selectedFile.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {getFileActionButton()}
                </CardContent>
              </Card>
            )}

            {/* Repository Sync */}
            {isProjectAdmin && (
              <ProjectSync
                project={project}
                onSyncComplete={handleSyncComplete}
                isProjectAdmin={isProjectAdmin}
              />
            )}

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.categories.map((category, index) => (
                    <Badge key={index} variant="outline">
                      {category.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 