/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  CheckCircle, 
  ChevronLeft,
  FileText,
  User,
  Target,
  BookOpen,
  Timer,
  Zap,
  Send,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { FirestoreFile, FirestoreProject } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import UnifiedLoader from '@/components/ui/UnifiedLoader';
import MobileRestriction, { useMobileRestriction } from '@/components/ui/MobileRestriction';

export default function TranslationPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const { user } = useAuth();
  const fileId = (params?.id || '') as string;
  
  // Mobile restriction check
  const { shouldRestrict, isLoading: mobileLoading } = useMobileRestriction();
  
  // Core state
  const [file, setFile] = useState<FirestoreFile | null>(null);
  const [project, setProject] = useState<FirestoreProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [translatedText, setTranslatedText] = useState('');
  const [translatorNotes, setTranslatorNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reviewInfo, setReviewInfo] = useState<any | null>(null);
  
  // UI state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Session tracking
  const [sessionStart] = useState(Date.now());
  const [wordCount, setWordCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Refs
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const sessionTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadFileData();
    
    // Start session timer
    sessionTimer.current = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    
    return () => {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [fileId]);

  const loadFileData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await user.getIdToken();
      
      // Load file details
      const fileResponse = await fetch(`/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!fileResponse.ok) {
        throw new Error('File not found');
      }
      
      const fileData = await fileResponse.json();
      setFile(fileData);
      setTranslatedText(fileData.translatedText || '');

      // Fetch review information if the file has been reviewed
      if (['rejected', 'accepted'].includes(fileData.status)) {
        try {
          const reviewRes = await fetch(`/api/reviews?fileId=${fileId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (reviewRes.ok) {
            const reviewResult = await reviewRes.json();
            if (reviewResult.success && reviewResult.data?.length > 0) {
              setReviewInfo(reviewResult.data[0]);
            }
          }
        } catch (err) {
          console.log('Could not load review info:', err);
        }
      }
      
      // Load project details
      if (fileData.projectId) {
        const projectResponse = await fetch(`/api/projects/${fileData.projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (projectResponse.ok) {
          const projectResult = await projectResponse.json();
          if (projectResult.success) {
            setProject(projectResult.data);
          }
        }
      }
      
    } catch (error) {
      console.error('Error loading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslationChange = (value: string) => {
    setTranslatedText(value);
    
    // Update word count
    const words = value.trim() ? value.trim().split(/\s+/)?.length : 0;
    setWordCount(words);
    
    // Trigger auto-save
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    setAutoSaveStatus('saving');
    
    autoSaveTimer.current = setTimeout(async () => {
      await saveTranslation(false); // Silent save
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 2000); // Auto-save after 2 seconds of inactivity
  };

  const saveTranslation = async (showFeedback = true) => {
    if (!file || !user) return;
    
    try {
      if (showFeedback) setSaving(true);
      
      const token = await user.getIdToken();
      
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          translatedText,
          actualHours: Math.round(timeElapsed / 3600 * 100) / 100, // Convert to hours with 2 decimal places
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save translation');
      }

      const result = await response.json();
      setFile(result);
      
      if (showFeedback) {
        alert('Translation saved successfully!');
      }
      
    } catch (error) {
      console.error('Error saving translation:', error);
      if (showFeedback) {
        alert('Failed to save translation. Please try again.');
      }
    } finally {
      if (showFeedback) setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!file || !user || !translatedText.trim()) {
      alert('Please enter a translation before submitting.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // First save the translation
      await saveTranslation(false);
      
      const token = await user.getIdToken();
      
      // Submit for review and create review entry
      const response = await fetch(`/api/files/${fileId}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          translatedText,
          actualHours: Math.round(timeElapsed / 3600 * 100) / 100,
          translatorNotes: translatorNotes || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit for review');
      }

      const result = await response.json();

      alert(`🎉 Translation submitted for review!\n\nReview ID: ${result.data.reviewId}\nYour translation has been saved and sent for expert review. You will be notified when the review is complete.`);
      
      // Redirect back to project
      if (project) {
        router.push(`/projects/${project.id}`);
      } else {
        router.push('/projects');
      }
      
    } catch (error) {
      console.error('Error submitting for review:', error);
      alert('Failed to submit for review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileStatusInfo = () => {
    if (!file) return { color: 'gray', label: 'Unknown' };
    
    switch (file.status) {
      case 'not taken':
        return { color: 'blue', label: 'Available' };
      case 'in progress':
        return { color: 'orange', label: 'In Progress' };
      case 'pending':
        return { color: 'yellow', label: 'Pending Review' };
      case 'rejected':
        return { color: 'red', label: 'Needs Revision' };
      case 'accepted':
        return { color: 'green', label: 'Accepted' };
      default:
        return { color: 'gray', label: file.status };
    }
  };

  // Show mobile restriction if on mobile
  if (!mobileLoading && shouldRestrict) {
    return (
      <MobileRestriction 
        title="Translation Editor Not Available"
        description="The translation editor requires a desktop environment for optimal text editing, review tools, and formatting controls."
      />
    );
  }

  if (loading) {
    return (
      <UnifiedLoader 
        message="Loading translation editor..."
        showHeader={true}
        theme="orange"
      />
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Translation Not Available</h2>
          <p className="text-red-600 mb-4">{error || 'File not found'}</p>
          <div className="space-y-2">
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Link href="/projects">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Browse Projects
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Check if user has permission to translate this file
  const canTranslate = file.assignedTranslatorId === user?.uid || 
                       (file.status === 'not taken' && !file.assignedTranslatorId) ||
                       file.createdBy === user?.uid; // Allow file creator to edit

  // Check if file is in read-only mode (submitted for review)
  const isUnderReview = file.status === 'pending';
  const isReadOnly = isUnderReview && file.assignedTranslatorId === user?.uid;
  
  const statusInfo = getFileStatusInfo();

  if (!canTranslate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="p-6 text-center max-w-md">
          <User className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            This file is assigned to another translator. Current status: {file.status}
            {file.assignedTranslatorId && file.assignedTranslatorId !== user?.uid && 
              " (assigned to someone else)"}
          </p>
          <div className="space-y-2 space-x-2">
            {project && (
              <Link href={`/projects/${project.id}`}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Back to Project
                </Button>
              </Link>
            )}
            <Link href="/projects">
              <Button variant="outline">
                Browse Other Projects
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Show read-only view if file is under review
  if (isReadOnly) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="p-6 text-center max-w-lg">
          <Timer className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Translation Under Review</h2>
          <p className="text-gray-600 mb-4">
            Your translation has been submitted and is currently being reviewed by our moderation team. 
            You cannot make changes until the review is complete.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Review Status: Pending</span>
            </div>
            <p className="text-sm text-yellow-700">
              • Translation submitted successfully<br/>
              • Awaiting moderator review<br/>
              • You will be notified when review is complete<br/>
              • If rejected, you&apos;ll be able to make revisions
            </p>
          </div>

          <div className="space-y-2 space-x-2">
            {project && (
              <Link href={`/projects/${project.id}`}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Back to Project
                </Button>
              </Link>
            )}
            <Link href="/projects">
              <Button variant="outline">
                Browse Other Projects
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {project ? (
                <Link href={`/projects/${project.id}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Project
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {file.fileName}
                </h1>
                <p className="text-gray-600">{file.filePath}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-save status */}
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Saving...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Saved</span>
                  </div>
                )}
              </div>
              
              {/* Session stats */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  {formatTime(timeElapsed)}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {wordCount} words
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Rejection Notice Banner */}
      {file.status === 'rejected' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Translation Rejected:</strong> Your translation was reviewed and needs revisions. 
                Please review the feedback and make necessary changes before resubmitting.
              </p>
              {reviewInfo?.comments && (
                <p className="mt-2 text-sm text-red-700">
                  <strong>Reviewer Comments:</strong> {reviewInfo.comments}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Translation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File Information
                  </CardTitle>
                  <Badge className={`bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Words:</span>
                    <div className="font-medium">{file.wordCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Estimated:</span>
                    <div className="font-medium">{file.estimatedHours}h</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Folder:</span>
                    <div className="font-medium">{file.folderPath || 'root'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Format:</span>
                    <div className="font-medium">{file.fileName.split('.').pop()?.toUpperCase()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Translation Interface */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Original Text
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                      {file.originalText}
                    </pre>
                  </div>
                </CardContent>
              </Card>
              
              {/* Translation Area */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Armenian Translation
                    <Badge variant="outline" className="ml-auto">
                      {wordCount} words
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <textarea
                      value={translatedText}
                      onChange={(e) => handleTranslationChange(e.target.value)}
                      placeholder="Enter Armenian translation here..."
                      className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      style={{ 
                        fontFamily: 'Arial, sans-serif',
                        direction: 'ltr',
                        textAlign: 'left'
                      }}
                    />
                    
                    {/* Translator notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translator Notes (optional)
                      </label>
                      <textarea
                        value={translatorNotes}
                        onChange={(e) => setTranslatorNotes(e.target.value)}
                        placeholder="Add notes about translation choices, context, etc."
                        className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {translatedText.trim() ? (
                      <span className="text-green-600">✓ Translation in progress</span>
                    ) : (
                      <span>Start typing to begin translation</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      onClick={() => saveTranslation(true)}
                      disabled={saving || !translatedText.trim()}
                      variant="outline"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    
                    <Button 
                      onClick={submitForReview}
                      disabled={submitting || !translatedText.trim()}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitting ? 'Submitting...' : 'Submit for Review'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Progress Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time elapsed:</span>
                    <span className="font-medium">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Words translated:</span>
                    <span className="font-medium">{wordCount}</span>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progress:</span>
                    <span className="font-medium">
                      {file.wordCount > 0 ? Math.round((wordCount / file.wordCount) * 100) : 0}%
                    </span>
                  </div> */}
                  {/* <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Words/hour:</span>
                    <span className="font-medium">
                      {timeElapsed > 0 ? Math.round((wordCount / timeElapsed) * 3600) : 0}
                    </span>
                  </div> */}
                </div>
                
                {/* Progress bar
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${file.wordCount > 0 ? Math.min(100, (wordCount / file.wordCount) * 100) : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-1">
                    {wordCount} / {file.wordCount} words
                  </div>
                </div> */}
              </CardContent>
            </Card>

            {/* Project Info */}
            {project && (
              <Card>
                <CardHeader>
                  <CardTitle>Project Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{project.title}</h4>
                      <p className="text-sm text-gray-500">v{project.version}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">By:</span>
                      <span className="ml-1 font-medium">{project.developedBy}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Translation Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle>Translation Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">📚 Terminology</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Keep technical terms consistent</li>
                      <li>• Use established Armenian vocabulary</li>
                      <li>• Provide transliteration for new terms</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">✍️ Format</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Preserve original structure</li>
                      <li>• Keep code examples intact</li>
                      <li>• Maintain URLs and references</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">🔍 Review</h4>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Focus on technical accuracy</li>
                      <li>• Ensure clarity for Armenian readers</li>
                      <li>• Review before submission</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 