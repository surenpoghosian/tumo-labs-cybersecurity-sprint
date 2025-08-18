import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Home, Search, Shield, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('HomePage');
  const navigation = useTranslations('Navigation');
  const errors = useTranslations('Errors');
  const notFound = useTranslations('NotFoundPage'); // <-- Add this line

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">{t('title')}</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-orange-600">{navigation('home')}</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-orange-600">{navigation('dashboard')}</Link>
            <Link href="/projects" className="text-gray-600 hover:text-orange-600">{navigation('projects')}</Link>
            <Link href="/certificates" className="text-gray-600 hover:text-orange-600">{navigation('certificates')}</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Error Icon */}
          <div className="relative mb-8">
            <div className="bg-orange-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-16 w-16 text-orange-600" />
            </div>
            <Shield className="h-8 w-8 text-red-500 absolute top-0 right-1/2 transform translate-x-8" />
          </div>

          {/* Error Message */}
          <h1 className="text-6xl font-bold text-gray-900 mb-4">{errors('404')}</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{errors('pageNotFound')}</h2>
          <p className="text-gray-600 mb-8 text-lg">
            {errors('pageNotFoundDescription')}
          </p>

          {/* Search Suggestions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {notFound('searchPrompt')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">🔒 {notFound('cybersecProjects')}</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• OWASP Top 10 translations</li>
                    <li>• Metasploit documentation</li>
                    <li>• Wireshark user guides</li>
                    <li>• Nmap reference materials</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 mb-2">📚 {notFound('platformFeatures')}</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {notFound('translationEditor')}</li>
                    <li>• {notFound('certificateVerification')}</li>
                    <li>• {notFound('projectDashboard')}</li>
                    <li>• {notFound('githubIntegration')}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              className="bg-orange-600 hover:bg-orange-700"
              title={notFound('goHome')}
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                {notFound('backToHome')}
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline"
              title={notFound('browseProjects')}
            >
              <Link href="/projects">
                <Shield className="h-4 w-4 mr-2" />
                {notFound('browseProjects')}
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline"
              title={notFound('dashboard')}
            >
              <Link href="/dashboard">
                <BookOpen className="h-4 w-4 mr-2" />
                {notFound('dashboard')}
              </Link>
            </Button>
          </div>

          {/* Help Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{notFound('needHelp')}</h3>
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/certificates" className="text-orange-600 hover:text-orange-700">
                {notFound('certificateVerification')}
              </Link>
              <Link href="/projects" className="text-orange-600 hover:text-orange-700">
                {notFound('availableProjects')}
              </Link>
              <Link href="/dashboard" className="text-orange-600 hover:text-orange-700">
                {notFound('yourDashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}