'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setIsSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later';
      default:
        return 'An error occurred. Please try again';
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <div className="container mx-auto px-4 py-8">
          <Link href="/auth/login" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </Link>
          
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Check Your Email</h1>
              <p className="text-gray-600">We`ve sent password reset instructions to your email</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Mail className="h-12 w-12 text-orange-600 mx-auto" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Reset link sent to:
                    </h3>
                    <p className="text-orange-600 font-medium">{email}</p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>• Check your inbox and spam folder</p>
                    <p>• Click the reset link in the email</p>
                    <p>• Create a new password</p>
                  </div>
                  <div className="pt-4">
                    <Link href="/auth/login">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        <Link href="/auth/login" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Sign In</span>
        </Link>
        
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-600">Enter your email to receive reset instructions</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Forgot Password</CardTitle>
              <CardDescription>
                We`ll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-2">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <Link href="/auth/login" className="text-orange-600 hover:text-orange-800 font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 