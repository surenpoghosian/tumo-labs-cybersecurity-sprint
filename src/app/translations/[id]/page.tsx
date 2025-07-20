/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ArrowLeft, 
  Calendar, 
  User, 
  Star,
  CheckCircle,
  Copy,
  Download,
  Share,
  Globe,
  Clock,
  FileText,
  Shield
} from 'lucide-react';
import Link from 'next/link';

interface TranslationDetail {
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
    source: string;
  };
  translator?: {
    name: string;
    username: string;
  };
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function TranslationDetailPage() {
  const params = useParams();
  const [translation, setTranslation] = useState<TranslationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTranslation();
  }, [params.id]);

  const fetchTranslation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/translations/${params.id}/public`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Translation not found or not yet approved.');
        } else {
          setError('Failed to load translation.');
        }
        return;
      }

      const result = await response.json();
      if (result.success) {
        setTranslation(result.data);
      } else {
        setError(result.error || 'Failed to load translation.');
      }
    } catch (error) {
      console.error('Error fetching translation:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranslation = async () => {
    if (!translation) return;
    
    try {
      await navigator.clipboard.writeText(translation.translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleDownload = () => {
    if (!translation) return;
    
    const content = `${translation.project.title} - ${translation.fileName}

Armenian Translation:
${translation.translatedText}

Original Text:
${translation.originalText}

---
Translated by: ${translation.translator?.name || 'Anonymous'}
Completed: ${new Date(translation.completedAt).toLocaleDateString()}
Word Count: ${translation.wordCount} words
Category: ${translation.category}
Source: ${translation.project.source}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${translation.fileName}-armenian.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!translation) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${translation.project.title} - Armenian Translation`,
          text: `Check out this Armenian translation of ${translation.fileName}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const getDifficultyBadge = (difficulty: number) => {
    const levels = ['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    const colors = ['bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800', 'bg-orange-100 text-orange-800', 'bg-red-100 text-red-800'];
    return (
      <Badge className={colors[difficulty - 1] || colors[2]}>
        {levels[difficulty - 1] || 'Unknown'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading translation...</p>
        </div>
      </div>
    );
  }

  if (error || !translation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-orange-600">Home</Link>
              <Link href="/translations" className="text-gray-600 hover:text-orange-600">Translations</Link>
            </nav>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="p-6">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Translation Not Available</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Link href="/translations">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Translations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-orange-600">Home</Link>
            <Link href="/translations" className="text-gray-600 hover:text-orange-600">Translations</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/translations" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Translations
          </Link>
        </div>

        {/* Title and Metadata */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-3">
                  {translation.project.title} - {translation.fileName}
                </CardTitle>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {translation.category}
                  </Badge>
                  {getDifficultyBadge(translation.project.difficulty)}
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved Translation
                  </Badge>
                </div>
                <p className="text-gray-600">{translation.project.description}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span>{translation.wordCount} words</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Completed: {new Date(translation.completedAt).toLocaleDateString()}</span>
              </div>
              {translation.translator && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>By: {translation.translator.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <span>Public Translation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowOriginal(!showOriginal)}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                {showOriginal ? 'Show Translation' : 'Show Original'}
              </Button>
              
              <Button
                onClick={handleCopyTranslation}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>
              
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {showOriginal ? 'Original English Text' : 'Armenian Translation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {showOriginal ? translation.originalText : translation.translatedText}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Source Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Project:</strong> {translation.project.title}
              </div>
              <div>
                <strong>File Path:</strong> {translation.filePath}
              </div>
              {translation.project.source && (
                <div>
                  <strong>Source Repository:</strong>{' '}
                  <a 
                    href={translation.project.source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {translation.project.source}
                  </a>
                </div>
              )}
              <div>
                <strong>Categories:</strong> {translation.project.categories.join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 