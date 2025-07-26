'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, RefreshCw, AlertTriangle, Home, Bug } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-orange-600">Home</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-orange-600">Dashboard</Link>
            <Link href="/projects" className="text-gray-600 hover:text-orange-600">Projects</Link>
            <Link href="/certificates" className="text-gray-600 hover:text-orange-600">Certificates</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Error Icon */}
          <div className="relative mb-8">
            <div className="bg-red-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-16 w-16 text-red-600" />
            </div>
            <Bug className="h-8 w-8 text-orange-500 absolute top-0 right-1/2 transform translate-x-8" />
          </div>

          {/* Error Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Something went wrong!</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Error</h2>
          <p className="text-gray-600 mb-8 text-lg">
            We encountered an unexpected error while processing your request. Our security team has been notified.
          </p>

          {/* Error Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Error Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-left">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Error Message:</h4>
                  <code className="text-sm text-red-600 bg-red-50 p-2 rounded block">
                    {error.message || 'Unknown error occurred'}
                  </code>
                </div>
                {error.digest && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Error ID:</h4>
                    <code className="text-sm text-gray-600 bg-gray-100 p-2 rounded block">
                      {error.digest}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recovery Options */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recovery Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">🔄 Try Again</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Refresh the page</li>
                    <li>• Clear browser cache</li>
                    <li>• Try a different browser</li>
                    <li>• Check your internet connection</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">📱 Alternative Actions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Visit your dashboard</li>
                    <li>• Browse available projects</li>
                    <li>• Check your certificates</li>
                    <li>• Return to homepage</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={reset}
              className="bg-orange-600 hover:bg-orange-700"
              title="Try to recover from the error"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              asChild
              variant="outline"
              title="Go back to the homepage"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              title="Visit your dashboard"
            >
              <Link href="/dashboard">
                <BookOpen className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Help Information */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Still having issues?</h3>
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/projects" className="text-orange-600 hover:text-orange-700">
                Browse Projects
              </Link>
              <Link href="/certificates" className="text-orange-600 hover:text-orange-700">
                View Certificates
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="text-orange-600 hover:text-orange-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 