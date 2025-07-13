import { BookOpen, Shield, Loader2 } from 'lucide-react';

export default function Loading() {
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
            <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-14 h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Loading Icon */}
          <div className="relative mb-8">
            <div className="bg-orange-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-16 w-16 text-orange-600 animate-spin" />
            </div>
            <Shield className="h-8 w-8 text-orange-500 absolute top-0 right-1/2 transform translate-x-8 animate-pulse" />
          </div>

          {/* Loading Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Preparing your cybersecurity documentation platform
          </p>

          {/* Loading States */}
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-600 rounded-full animate-pulse"></div>
              <div className="w-48 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-40 h-3 bg-gray-200 rounded animate-pulse delay-100"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-300 rounded-full animate-pulse delay-200"></div>
              <div className="w-44 h-3 bg-gray-200 rounded animate-pulse delay-200"></div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="mt-8 text-sm text-gray-500">
            <div className="animate-pulse">
              Securing your translation environment...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 