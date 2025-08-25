
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  UserCheck,
  BarChart3,
  Filter,
  RefreshCw,
  Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DocumentVisibilityControl } from '@/components/moderation/DocumentVisibilityControl';
import UnifiedLoader from '@/components/ui/UnifiedLoader';
import { FirestoreFile } from '@/lib/firestore';
import AppHeader from '@/components/ui/AppHeader';
import MobileRestriction, { useMobileRestriction } from '@/components/ui/MobileRestriction';
import { useTranslations } from 'next-intl';

interface Review {
  id: string;
  fileId: string;
  translationId: string;
  reviewerId: string;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  comments: string;
  createdAt: string;
  dueDate?: string;
  category: string;
  file?: {
    fileName: string;
    filePath: string;
    wordCount: number;
    translatedText: string;
    originalText: string;
  };
  project?: {
    title: string;
    categories: string[];
  };
  translator?: {
    name: string;
    email: string;
    username: string;
  };
}

interface ReviewStats {
  total: number;
  pending: number;
  inProgress: number;
  approved: number;
  rejected: number;
}

export default function ModerationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ total: 0, pending: 0, inProgress: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Mobile restriction check
  const { shouldRestrict, isLoading: mobileLoading } = useMobileRestriction();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'assigned' | 'approved-docs'>('pending');
  const [reviewDecision, setReviewDecision] = useState<{ [key: string]: { decision: string; comments: string } }>({});
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [approvedDocuments, setApprovedDocuments] = useState<FirestoreFile[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const moderation = useTranslations("Moderation");

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filter === 'assigned') {
        params.append('assignedToMe', 'true');
      } else if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/reviews?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const result = await response.json();
      setReviews(result.data || []);
      setStats(result.stats || { total: 0, pending: 0, inProgress: 0, approved: 0, rejected: 0 });
      // Check user role for authorization

      // Allow access if user is explicitly marked as moderator or if their role is moderator/administrator
      if (!result.meta?.isModerator && !['moderator', 'administrator'].includes(result.meta?.userRole)) {
        router.push('/dashboard');
        return;
      }

    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filter, user, router]);

  const fetchApprovedDocuments = useCallback(async () => {
    try {
      setLoadingDocs(true);

      const response = await fetch('/api/files?status=accepted', {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approved documents');
      }

      const result = await response.json();
      setApprovedDocuments(result.data || []);

    } catch (error) {
      console.error('Error fetching approved documents:', error);
      setApprovedDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (filter === 'approved-docs') {
        fetchApprovedDocuments();
      } else {
        fetchReviews();
      }
    }
  }, [user, filter, fetchReviews, fetchApprovedDocuments]);

  const handleDocumentUpdate = (fileId: string, updates: Partial<FirestoreFile>) => {
    setApprovedDocuments(prev =>
      prev.map(doc =>
        doc.id === fileId
          ? { ...doc, ...updates }
          : doc
      )
    );
  };

  const handleTakeReview = async (reviewId: string) => {
    setProcessing(prev => ({ ...prev, [reviewId]: true }));

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          reviewId,
          takeReview: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to take review');
      }

      // Switch to in-progress view so the newly assigned review is visible
      setFilter('in-progress');

    } catch (error) {
      console.error('Error taking review:', error);
      alert('Failed to take review. Please try again.');
    } finally {
      setProcessing(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleReviewDecision = async (reviewId: string, decision: 'approve' | 'reject') => {
    const comments = reviewDecision[reviewId]?.comments || '';

    setProcessing(prev => ({ ...prev, [reviewId]: true }));

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          reviewId,
          decision,
          comments,
          securityAccuracyScore: decision === 'approve' ? 9 : 5,
          languageQualityScore: decision === 'approve' ? 8 : 6,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${decision} review`);
      }

      // Clear the decision state
      setReviewDecision(prev => {
        const newState = { ...prev };
        delete newState[reviewId];
        return newState;
      });

      // Refresh reviews
      await fetchReviews();

    } catch (error) {
      console.error(`Error ${decision}ing review:`, error);
      alert(`Failed to ${decision} review. Please try again.`);
    } finally {
      setProcessing(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Eye },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-orange-100 text-orange-800',
      'high': 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium}>
        {priority}
      </Badge>
    );
  };

  // Show mobile restriction if on mobile
  if (!mobileLoading && shouldRestrict) {
    return (
      <MobileRestriction
        title={moderation('mobile.title')}
        description={moderation('mobile.description')}
      />
    );
  }

  if (loading) {
    return (
      <UnifiedLoader
        message={moderation('loading')}
        showHeader={false}
        theme="blue"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppHeader currentPage="moderation" />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{moderation('title')}</h1>
          <p className="text-gray-600">{moderation('description')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">{moderation('total')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              <div className="text-sm text-gray-600">{moderation('pending')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">{moderation('progress')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
              <div className="text-sm text-gray-600">{moderation('approved')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
              <div className="text-sm text-gray-600">{moderation('rejected')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex gap-2">
                {['all', 'pending', 'in-progress', 'assigned', 'approved-docs'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status as 'all' | 'pending' | 'in-progress' | 'assigned' | 'approved-docs')}
                    className={filter === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {status === 'assigned' ? 'Assigned to Me' :
                      status === 'approved-docs' ? 'Approved Docs' :
                        status.replace('-', ' ')}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReviews}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {moderation('refresh')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content based on filter */}
        {filter === 'approved-docs' ? (
          /* Approved Documents View */
          <div className="space-y-6">
            {loadingDocs ? (
              <UnifiedLoader
                message={moderation('approvedDocuments.loading')}
                showHeader={false}
                theme="blue"
              />
            ) : approvedDocuments?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {moderation('approvedDocuments.noApproved')}
                  </h3>
                  <p className="text-gray-600">
                    {moderation('approvedDocuments.noApprovedTranslations')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              approvedDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.fileName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{doc.filePath}</p>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline">{doc.wordCount} {moderation("approvedDocuments.words")}</Badge>
                          <Badge variant="secondary">{doc.status}</Badge>
                          <Badge variant="outline">
                            {new Date(doc.updatedAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DocumentVisibilityControl
                          file={doc}
                          onUpdate={handleDocumentUpdate}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/docs/project/${doc.id}`, '_blank')}
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          {moderation('approvedDocuments.viewPublic')}
                        </Button>
                      </div>
                    </div>

                    {/* Document Preview */}
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{moderation('approvedDocuments.originalContent')}</h4>
                          <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 max-h-48 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                              {doc.originalText}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">{moderation('approvedDocuments.translation')}</h4>
                          <div className="bg-orange-50 p-3 rounded text-sm text-gray-700 max-h-48 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                              {doc.translatedText}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Reviews List */
          <div className="space-y-6">
            {reviews?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{moderation("review.noReviews")}</h3>
                  <p className="text-gray-600">
                    {filter === 'pending' ? moderation("review.noPendingReviews") :
                      filter === 'assigned' ? moderation("review.noReviewsAssigned") :
                        moderation("review.noReviewsFilter")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {review.file?.fileName || 'Unknown File'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(review.status)}
                          {getPriorityBadge(review.priority)}
                          <Badge variant="outline" className="text-xs">
                            {review.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{moderation("review.created")}: {new Date(review.createdAt).toLocaleDateString()}</div>
                        {review.dueDate && (
                          <div>{moderation("review.due")}: {new Date(review.dueDate).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Review Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{moderation("review.title")}</h4>
                        <div className="text-sm space-y-1">
                          <div><strong>{moderation("review.project")}:</strong> {review.project?.title || 'Unknown Project'}</div>
                          <div><strong>{moderation("review.filePath")}:</strong> {review.file?.filePath || 'Unknown'}</div>
                          <div><strong>{moderation("review.wordCount")}:</strong> {review.file?.wordCount || 0} {moderation("words")}</div>
                          {review.translator && (
                            <div className="space-y-0.5">
                              <div><strong>{moderation("review.translator")}:</strong> {review.translator.name}</div>
                              {review.translator.username && (
                                <div className="text-xs text-gray-500"><strong>{moderation("review.username")}:</strong> {review.translator.username}</div>
                              )}
                              {review.translator.email && (
                                <div className="text-xs text-gray-500"><strong>{moderation("review.email")}:</strong> {review.translator.email}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>


                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{moderation("review.originalText")}</h4>
                        <div className="text-sm bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                            {review.file?.originalText || 'No original text available'}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{moderation("review.translation")}</h4>
                        <div className="text-sm bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                            {review.file?.translatedText || 'No translation text available'}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t pt-4">
                      {review.status === 'pending' && !review.reviewerId && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleTakeReview(review.id)}
                            disabled={processing[review.id]}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            {processing[review.id] ? 'Taking...' : 'Take Review'}
                          </Button>
                        </div>
                      )}

                      {(review.status === 'in-progress' && review.reviewerId === user?.uid) && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {moderation("review.reviewComments")}
                            </label>
                            <textarea
                              className="w-full p-3 border rounded-md resize-none"
                              rows={3}
                              placeholder="Add your review comments..."
                              value={reviewDecision[review.id]?.comments || ''}
                              onChange={(e) => setReviewDecision(prev => ({
                                ...prev,
                                [review.id]: { ...prev[review.id], comments: e.target.value }
                              }))}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReviewDecision(review.id, 'approve')}
                              disabled={processing[review.id]}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {processing[review.id] ? 'Processing...' : 'Approve'}
                            </Button>

                            <Button
                              onClick={() => handleReviewDecision(review.id, 'reject')}
                              disabled={processing[review.id]}
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {processing[review.id] ? 'Processing...' : 'Reject'}
                            </Button>
                          </div>
                        </div>
                      )}

                      {review.status === 'approved' || review.status === 'rejected' ? (
                        <div className="text-sm text-gray-600">
                          <strong>{moderation("review.reviewCompleted")}:</strong> {review.comments || moderation("review.noComments")}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 