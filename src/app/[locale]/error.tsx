'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, RefreshCw, AlertTriangle, Home, Bug } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const navigation = useTranslations("Navigation");
  const errorPage = useTranslations("ErrorPage"); // <-- Add this line

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
            <Link href="/" className="text-gray-600 hover:text-orange-600">{navigation("home")}</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-orange-600">{navigation("dashboard")}</Link>
            <Link href="/projects" className="text-gray-600 hover:text-orange-600">{navigation("projects")}</Link>
            <Link href="/certificates" className="text-gray-600 hover:text-orange-600">{navigation("certificates")}</Link>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{errorPage("somethingWentWrong")}</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{errorPage("systemError")}</h2>
          <p className="text-gray-600 mb-8 text-lg">
            {errorPage("unexpectedError")}
          </p>

          {/* Error Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                {errorPage("errorDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-left">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">{errorPage("errorMessage")}</h4>
                  <code className="text-sm text-red-600 bg-red-50 p-2 rounded block">
                    {error.message || errorPage("unknownError")}
                  </code>
                </div>
                {error.digest && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{errorPage("errorId")}</h4>
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
                {errorPage("recoveryOptions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">🔄 {errorPage("tryAgain")}</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {errorPage("refreshPage")}</li>
                    <li>• {errorPage("clearCache")}</li>
                    <li>• {errorPage("tryDifferentBrowser")}</li>
                    <li>• {errorPage("checkConnection")}</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">📱 {errorPage("alternativeActions")}</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {errorPage("visitDashboard")}</li>
                    <li>• {errorPage("browseProjects")}</li>
                    <li>• {errorPage("checkCertificates")}</li>
                    <li>• {errorPage("returnHome")}</li>
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
              title={errorPage("tryToRecover")}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {errorPage("tryAgain")}
            </Button>

            <Button
              asChild
              variant="outline"
              title={errorPage("goHome")}
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                {errorPage("backToHome")}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              title={errorPage("visitDashboard")}
            >
              <Link href="/dashboard">
                <BookOpen className="h-4 w-4 mr-2" />
                {navigation("dashboard")}
              </Link>
            </Button>
          </div>

          {/* Help Information */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{errorPage("stillHavingIssues")}</h3>
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/projects" className="text-orange-600 hover:text-orange-700">
                {errorPage("browseProjects")}
              </Link>
              <Link href="/certificates" className="text-orange-600 hover:text-orange-700">
                {errorPage("viewCertificates")}
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="text-orange-600 hover:text-orange-700"
              >
                {errorPage("refreshPage")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}