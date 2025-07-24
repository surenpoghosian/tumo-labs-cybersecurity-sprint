/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signInWithGoogle, signInWithGitHub } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await signInWithGitHub();
      router.push('/dashboard');
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials';
      case 'auth/auth-domain-config-required':
        return 'GitHub authentication is not properly configured';
      case 'auth/cancelled-popup-request':
        return 'Only one popup request is allowed at one time';
      case 'auth/popup-blocked':
        return 'Popup was blocked by your browser. Please allow popups and try again';
      default:
        return 'An error occurred during sign-in. Please try again';
    }
  };
  const t = useTranslations('Auth');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">{t('login.title')}</h1>
            <p className="text-gray-600">Sign in to continue translating cybersecurity docs</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Choose your preferred sign-in method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OAuth Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </Button>

                <Button
                  onClick={handleGitHubLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 border-gray-300 hover:bg-gray-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </Button>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                  {error}
                </div>
              )}

              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" className="text-orange-600 hover:text-orange-800 font-medium">
                  Sign up here
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 