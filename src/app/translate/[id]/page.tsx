'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Clock, 
  CheckCircle, 
  MessageSquare,
  Lightbulb,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  GitPullRequest,
  BookOpen,
  Timer,
  Zap,
  Eye,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';
import { TranslationProject, CyberSecProject } from '@/data/mockData';
import Link from 'next/link';

interface TranslationSegment {
  id: string;
  translationProjectId: string;
  segmentIndex: number;
  originalText: string;
  translatedText: string;
  status: 'pending' | 'in-progress' | 'completed' | 'reviewed';
  translatorNotes: string;
  reviewComments: ReviewComment[];
  lastModified: string;
  estimatedWords: number;
  actualWords: number;
}

interface ReviewComment {
  id: string;
  reviewerId: string;
  segmentId: string;
  commentText: string;
  type: 'suggestion' | 'correction' | 'question' | 'approval';
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}

interface TranslationMemoryEntry {
  id: string;
  originalText: string;
  translatedText: string;
  context: string;
  category: string;
  confidence: number;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

interface TranslationSession {
  id: string;
  translationProjectId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  segmentsWorked: number;
  wordsTranslated: number;
  autoSaves: number;
}

const TranslationEditor = () => {
  const params = useParams();
  const projectId = params.id as string;
  
  // Core state
  const [segments, setSegments] = useState<TranslationSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [project, setProject] = useState<TranslationProject | null>(null);
  const [cyberSecProject, setCyberSecProject] = useState<CyberSecProject | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Translation memory and suggestions
  const [translationSuggestions, setTranslationSuggestions] = useState<TranslationMemoryEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Auto-save and session tracking
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [session, setSession] = useState<TranslationSession | null>(null);
  const [sessionStats, setSessionStats] = useState({
    wordsTranslated: 0,
    timeElapsed: 0,
    autoSaves: 0
  });
  
  // Progress tracking
  const [segmentStats, setSegmentStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    reviewed: 0,
    pending: 0,
    totalWords: 0,
    translatedWords: 0,
    completionPercentage: 0
  });
  
  // Review system
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  
  // Refs for auto-save
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const translationTextRef = useRef<HTMLTextAreaElement>(null);
  const sessionTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project details
        const projectResponse = await fetch(`/api/translations/${projectId}`);
        const projectData = await projectResponse.json();
        setProject(projectData.data);
        
        // Load cybersecurity project details
        const cyberSecResponse = await fetch(`/api/projects/${projectData.data.cyberSecProjectId}`);
        const cyberSecData = await cyberSecResponse.json();
        setCyberSecProject(cyberSecData.data);
        
        // Load segments
        const segmentsResponse = await fetch(`/api/translations/${projectId}/segments`);
        const segmentsData = await segmentsResponse.json();
        
        if (segmentsData.success && segmentsData.data) {
          setSegments(segmentsData.data);
          setSegmentStats(segmentsData.stats);
        } else {
          console.error('Failed to load segments:', segmentsData.error);
          throw new Error(segmentsData.error || 'Failed to load translation segments');
        }
        
        // Start translation session
        const sessionResponse = await fetch(`/api/translations/${projectId}/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' })
        });
        const sessionData = await sessionResponse.json();
        setSession(sessionData.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    loadData();
    
    // Start session timer
    sessionTimer.current = setInterval(() => {
      setSessionStats(prev => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 1
      }));
    }, 1000);
    
    return () => {
      if (sessionTimer.current) {
        clearInterval(sessionTimer.current);
      }
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [projectId]);
  
  // Auto-save functionality
  const triggerAutoSave = async (segmentId: string, content: string) => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    setAutoSaveStatus('saving');
    
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/translations/${projectId}/autosave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segmentId, content })
        });
        
        setAutoSaveStatus('saved');
        setSessionStats(prev => ({ ...prev, autoSaves: prev.autoSaves + 1 }));
        
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('idle');
      }
    }, 1000);
  };
  
  // Handle translation text change
  const handleTranslationChange = (value: string) => {
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment) return;
    
    // Determine segment status based on content
    let status: 'pending' | 'in-progress' | 'completed' | 'reviewed';
    if (!value || value.trim().length === 0) {
      status = 'pending';
    } else if (value.trim().length >= 10) { // Consider completed if translation has at least 10 characters
      status = 'completed';
    } else {
      status = 'in-progress';
    }
    
    // Update segment
    const updatedSegments = [...segments];
    const previousStatus = currentSegment.status;
    updatedSegments[currentSegmentIndex] = {
      ...currentSegment,
      translatedText: value,
      status: status,
      actualWords: value ? value.split(' ').length : 0,
      lastModified: new Date().toISOString()
    };
    setSegments(updatedSegments);
    
    // Update segment stats
    const updatedStats = { ...segmentStats };
    
    // Adjust counts based on status change
    if (previousStatus !== status) {
      // Decrement old status count
      if (previousStatus === 'pending') updatedStats.pending--;
      else if (previousStatus === 'in-progress') updatedStats.inProgress--;
      else if (previousStatus === 'completed') updatedStats.completed--;
      
      // Increment new status count
      if (status === 'pending') updatedStats.pending++;
      else if (status === 'in-progress') updatedStats.inProgress++;
      else if (status === 'completed') updatedStats.completed++;
      
      // Update completion percentage
      updatedStats.completionPercentage = Math.round((updatedStats.completed / updatedStats.total) * 100);
      setSegmentStats(updatedStats);
    }
    
    // Update session stats
    const wordCount = value ? value.split(' ').length : 0;
    const previousWordCount = currentSegment.actualWords;
    const wordDifference = wordCount - previousWordCount;
    
    setSessionStats(prev => ({
      ...prev,
      wordsTranslated: Math.max(0, prev.wordsTranslated + wordDifference)
    }));
    
    // Trigger auto-save
    triggerAutoSave(currentSegment.id, value);
    
    // Get translation suggestions
    if (value.length > 3) {
      fetchTranslationSuggestions(value);
    }
  };
  
  // Fetch translation suggestions
  const fetchTranslationSuggestions = async (text: string) => {
    try {
      const response = await fetch(`/api/translation-memory?q=${encodeURIComponent(text)}`);
      const data = await response.json();
      setTranslationSuggestions(data.data);
      setShowSuggestions(data.data.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };
  
  // Save current segment
  const saveSegment = async () => {
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment) return;
    
    try {
      const response = await fetch(`/api/translations/segments/${currentSegment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translatedText: currentSegment.translatedText,
          translatorNotes: currentSegment.translatorNotes,
          status: currentSegment.translatedText ? 'completed' : 'pending'
        })
      });
      
      if (response.ok) {
        // Update segment stats
        const updatedStats = { ...segmentStats };
        if (currentSegment.status === 'pending' && currentSegment.translatedText) {
          updatedStats.pending--;
          updatedStats.completed++;
        }
        updatedStats.completionPercentage = Math.round((updatedStats.completed / updatedStats.total) * 100);
        setSegmentStats(updatedStats);
      }
    } catch (error) {
      console.error('Error saving segment:', error);
    }
  };
  
  // Navigation
  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setShowSuggestions(false);
    }
  };
  
  const goToNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setShowSuggestions(false);
    }
  };
  
  // Apply suggestion
  const applySuggestion = (suggestion: TranslationMemoryEntry) => {
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment) return;
    
    const updatedText = currentSegment.translatedText.replace(
      new RegExp(suggestion.originalText, 'gi'),
      suggestion.translatedText
    );
    
    handleTranslationChange(updatedText);
    
    // Update usage count
    fetch('/api/translation-memory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: suggestion.id, usageCount: suggestion.usageCount })
    });
    
    setShowSuggestions(false);
  };
  
  // Submit for review
  const submitForReview = async () => {
    try {
      setSubmitting(true);
      
      // Calculate completion notes
      const completedSegments = segments.filter(s => s.status === 'completed').length;
      const completionNotes = `Translation completed: ${completedSegments}/${segments.length} segments translated. Total words: ${sessionStats.wordsTranslated}. Time spent: ${formatTime(sessionStats.timeElapsed)}.`;
      
      const response = await fetch(`/api/translations/${projectId}/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'user-1', // In a real app, get this from auth context
          completionNotes,
          requestCertificate: true
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit for review');
      }
      
      if (result.success) {
        // End session
        if (session) {
          await fetch(`/api/translations/${projectId}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'end',
              sessionId: session.id,
              startTime: session.startTime,
              segmentsWorked: segments.filter(s => s.actualWords > 0).length,
              wordsTranslated: sessionStats.wordsTranslated,
              autoSaves: sessionStats.autoSaves
            })
          });
        }
        
        // Show success message with next steps
        alert(`🎉 Translation submitted successfully!\n\n` +
              `PR Created: ${result.data.translationProject.prUrl}\n` +
              `Assigned Reviewer: ${result.data.translationProject.assignedReviewer}\n` +
              `Estimated Review Time: ${result.data.nextSteps.estimatedCompletionTime}\n\n` +
              `You will be redirected to the project page.`);
        
        // Redirect to project page
        window.location.href = `/projects/${project?.cyberSecProjectId}`;
      }
    } catch (error) {
      console.error('Error submitting for review:', error);
      alert('Failed to submit translation for review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translation editor...</p>
        </div>
      </div>
    );
  }
  
  const currentSegment = segments[currentSegmentIndex];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href={`/projects/${project?.cyberSecProjectId}`}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Project
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {cyberSecProject?.name} Translation
                </h1>
                <p className="text-gray-600 mt-1">
                  {project?.documentPath} • Segment {currentSegmentIndex + 1} of {segments.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-save status */}
              <div className="flex items-center gap-2">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock className="h-4 w-4 animate-spin" />
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
                  {formatTime(sessionStats.timeElapsed)}
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {sessionStats.wordsTranslated} words
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  {sessionStats.autoSaves} saves
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Translation Progress</span>
              <span className="text-sm text-gray-600">{segmentStats.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${segmentStats.completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-600">
              <span>{segmentStats.completed} completed</span>
              <span>{segmentStats.inProgress} in progress</span>
              <span>{segmentStats.pending} pending</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Translation Area */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Text */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Original Text
                    <Badge variant="outline" className="ml-auto">
                      {currentSegment?.estimatedWords || 0} words
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {currentSegment?.originalText || 'No content available'}
                    </p>
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
                      {currentSegment?.actualWords || 0} words
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <textarea
                      ref={translationTextRef}
                      value={currentSegment?.translatedText || ''}
                      onChange={(e) => handleTranslationChange(e.target.value)}
                      placeholder="Enter Armenian translation here..."
                      className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      style={{ 
                        fontFamily: 'Arial, sans-serif',
                        direction: 'ltr',
                        textAlign: 'left'
                      }}
                    />
                    
                    {/* Translation suggestions */}
                    {showSuggestions && translationSuggestions.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Translation Suggestions</span>
                        </div>
                        <div className="space-y-2">
                          {translationSuggestions.map((suggestion) => (
                            <div 
                              key={suggestion.id}
                              className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-blue-50"
                              onClick={() => applySuggestion(suggestion)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800">
                                    {suggestion.originalText}
                                  </span>
                                  <span className="text-gray-500">→</span>
                                  <span className="text-gray-700">
                                    {suggestion.translatedText}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {suggestion.context} • {Math.round(suggestion.confidence * 100)}% confidence
                                </div>
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                {suggestion.usageCount} uses
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Translator notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Translator Notes (optional)
                      </label>
                      <textarea
                        value={currentSegment?.translatorNotes || ''}
                        onChange={(e) => {
                          const updatedSegments = [...segments];
                          updatedSegments[currentSegmentIndex] = {
                            ...currentSegment,
                            translatorNotes: e.target.value
                          };
                          setSegments(updatedSegments);
                        }}
                        placeholder="Add notes about translation choices, context, etc."
                        className="w-full h-16 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Review Comments */}
            {currentSegment?.reviewComments && currentSegment.reviewComments.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Review Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentSegment.reviewComments.map((comment) => (
                      <div 
                        key={comment.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          comment.type === 'correction' ? 'bg-red-50 border-red-500' :
                          comment.type === 'suggestion' ? 'bg-blue-50 border-blue-500' :
                          comment.type === 'question' ? 'bg-yellow-50 border-yellow-500' :
                          'bg-green-50 border-green-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={comment.resolved ? 'default' : 'secondary'}>
                                {comment.type}
                              </Badge>
                              <Badge variant="outline">
                                {comment.severity}
                              </Badge>
                              {comment.resolved && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-gray-800">{comment.commentText}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Navigation and Actions */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={goToPreviousSegment}
                  disabled={currentSegmentIndex === 0}
                  variant="outline"
                  title="Go to the previous text segment"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={goToNextSegment}
                  disabled={currentSegmentIndex === segments.length - 1}
                  variant="outline"
                  title="Go to the next text segment"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={saveSegment} 
                  variant="outline"
                  title="Save the current segment translation"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Segment
                </Button>
                <Button 
                  onClick={submitForReview}
                  disabled={segmentStats.completionPercentage < 100 || submitting}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  title={segmentStats.completionPercentage < 100 ? 'Complete all segments before submitting' : submitting ? 'Submitting for review...' : 'Submit translation for expert review'}
                >
                  <GitPullRequest className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Segment Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Segment Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {currentSegmentIndex + 1}
                      </div>
                      <div className="text-sm text-gray-600">Current</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {segments.length}
                      </div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={
                        currentSegment?.status === 'completed' ? 'default' :
                        currentSegment?.status === 'in-progress' ? 'secondary' :
                        'outline'
                      }>
                        {currentSegment?.status || 'pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Estimated:</span>
                      <span>{currentSegment?.estimatedWords || 0} words</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Translated:</span>
                      <span>{currentSegment?.actualWords || 0} words</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Comments:</span>
                      <span>{currentSegment?.reviewComments?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Session Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time elapsed:</span>
                    <span className="font-medium">{formatTime(sessionStats.timeElapsed)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Words translated:</span>
                    <span className="font-medium">{sessionStats.wordsTranslated}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto-saves:</span>
                    <span className="font-medium">{sessionStats.autoSaves}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Words/hour:</span>
                    <span className="font-medium">
                      {sessionStats.timeElapsed > 0 
                        ? Math.round((sessionStats.wordsTranslated / sessionStats.timeElapsed) * 3600)
                        : 0
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    title={showSuggestions ? 'Hide translation suggestions' : 'Show translation suggestions from memory'}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Toggle Suggestions
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowReviewPanel(!showReviewPanel)}
                    title={showReviewPanel ? 'Hide review comments panel' : 'Show review comments and feedback'}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review Panel
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open('/certificates', '_blank')}
                    title="View your earned certificates in a new tab"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Certificates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationEditor; 