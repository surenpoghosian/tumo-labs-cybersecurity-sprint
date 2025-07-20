/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  AlertCircle,
  Eye,
  UserCheck,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'assigned'>('pending');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [reviewDecision, setReviewDecision] = useState<{ [key: string]: { decision: string; comments: string } }>({});
  const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string>('contributor');

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user, filter]);

  const fetchReviews = async () => {
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
      setUserRole(result.meta?.userRole || 'contributor');

      // Check if user is authorized
      if (!result.meta?.isModerator && result.meta?.userRole !== 'administrator') {
        router.push('/dashboard');
        return;
      }

    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
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

      // Refresh reviews
      await fetchReviews();
      
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
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Սպասվող' },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Eye, label: 'Ընթացքում' },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Հաստատված' },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Մերժված' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Մոդերացիայի վահանակը բեռնվում է...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Մոդերացիայի վահանակ</h1>
          <p className="text-gray-600">Վերանայեք և մոդերացրեք թարգմանության ներկայացումները</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Ընդհանուր վերանայություններ</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              <div className="text-sm text-gray-600">Սպասվող</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">Ընթացքում</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
              <div className="text-sm text-gray-600">Հաստատված</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
              <div className="text-sm text-gray-600">Մերժված</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex gap-2">
                {['all', 'pending', 'in-progress', 'assigned'].map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(status as any)}
                    className={filter === status ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {status === 'assigned' ? 'Ազատված եմ' : status.replace('-', ' ')}
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
                Վերականգնել
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Հաստատված վերանայություններ չեն գտնվել</h3>
                <p className="text-gray-600">
                  {filter === 'pending' ? 'Սպասվող վերանայություններ հիմա չկան։' : 
                   filter === 'assigned' ? 'Ազատված եք վերանայությունների համար։' : 
                   'Համապատասխան վերանայություններ չեն գտնվել։'
                }
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
                        {review.file?.fileName || 'Անհայտ ֆայլ'}
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
                      <div>Ստեղծվել է: {new Date(review.createdAt).toLocaleDateString()}</div>
                      {review.dueDate && (
                        <div>Վավերականացվել է: {new Date(review.dueDate).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Review Info */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Առաջարկությունների և ֆայլի տեղեկություն</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>Առաջարկություն:</strong> {review.project?.title || 'Անհայտ առաջարկություն'}</div>
                        <div><strong>Ֆայլի ուղի:</strong> {review.file?.filePath || 'Անհայտ'}</div>
                        <div><strong>Բառանիշերի քանակ:</strong> {review.file?.wordCount || 0} բառ</div>
                        {review.translator && (
                          <div><strong>Թարգմանող:</strong> {review.translator.name}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Թարգմանության նախադիտում</h4>
                      <div className="text-sm bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                        {review.file?.translatedText ? 
                          review.file.translatedText.substring(0, 200) + 
                          (review.file.translatedText?.length > 200 ? '...' : '') : 
                          'Թարգմանության տեքստ չկա'
                        }
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
                          {processing[review.id] ? 'Առաջարկում է...' : 'Առաջարկել'}
                        </Button>
                      </div>
                    )}
                    
                    {(review.status === 'in-progress' && review.reviewerId === user?.uid) && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Վերանայությունների մեկնաբանություններ
                          </label>
                          <textarea
                            className="w-full p-3 border rounded-md resize-none"
                            rows={3}
                            placeholder="Ավելացրեք ձեր վերանայությունների մեկնաբանությունները..."
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
                            {processing[review.id] ? 'Ծրագրավորվում է...' : 'Հաստատել'}
                          </Button>
                          
                          <Button
                            onClick={() => handleReviewDecision(review.id, 'reject')}
                            disabled={processing[review.id]}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {processing[review.id] ? 'Ծրագրավորվում է...' : 'Մերժել'}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {review.status === 'approved' || review.status === 'rejected' ? (
                      <div className="text-sm text-gray-600">
                        <strong>Վերանայությունը ավարտվել է:</strong> {review.comments || 'Մեկնաբանություն չկա'}
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 