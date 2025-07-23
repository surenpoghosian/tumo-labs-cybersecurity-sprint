'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Certificate } from "@/data/mockData";
import { BookOpen, Award, Download, ExternalLink, Github, Search, Calendar, Shield } from "lucide-react";
import Link from "next/link";

interface VerificationResult {
  success: boolean;
  certificate?: Certificate;
  data?: Certificate & { user?: { name: string } };
  error?: string;
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await fetch('/api/certificates?userId=user-1');
        const result = await response.json();
        setCertificates(result.data);
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleVerifyCertificate = async () => {
    if (!verificationCode.trim()) return;

    setVerifying(true);
    setVerificationResult(null);
    
    try {
      const response = await fetch(`/api/certificates/verify/${verificationCode}`);
      const result = await response.json();
      setVerificationResult(result);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setVerificationResult({ success: false, error: 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadCertificate = async (certificate: Certificate) => {
    try {
      const filename = `${certificate.id}.pdf`;
      const response = await fetch(`/api/certificates/download/${filename}`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificate.verificationCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Error downloading certificate:', err);
      alert('Failed to download certificate. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-5 w-5 text-orange-600";
    switch (category.toLowerCase()) {
      case 'web security': return <Shield className={iconClass} />;
      case 'network security': return <Shield className={iconClass} />;
      case 'penetration testing': return <Shield className={iconClass} />;
      case 'digital forensics': return <Search className={iconClass} />;
      case 'malware analysis': return <Shield className={iconClass} />;
      default: return <Award className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-orange-600" />
            <span className="text-xl font-bold text-gray-900">Հայկական Կիբեռանվտանգության Փաստաթղթեր</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-orange-600">Վահանակ</Link>
            <Link href="/projects" className="text-gray-600 hover:text-orange-600">Նախագծեր</Link>
            <Link href="/certificates" className="text-orange-600 font-medium">Վկայագրեր</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ձեր վկայագրերը</h1>
          <p className="text-gray-600">Դիտեք և ստուգեք ձեր կիբեռանվտանգության թարգմանության վկայագրերը</p>
        </div>

        {/* Certificate Verification */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ստուգել վկայագիրը</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Մուտքագրեք վավերացման կոդը (օր.՝ CYBS-CERT-2025-001)"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Button 
                onClick={handleVerifyCertificate}
                disabled={!verificationCode.trim() || verifying}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {verifying ? 'Ստուգվում է...' : 'Ստուգել'}
              </Button>
            </div>
            
            {verificationResult && (
              <div className="mt-4">
                {verificationResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Վկայագիրը ստուգված է</span>
                    </div>
                    <div className="space-y-1 text-sm text-green-800">
                      <p><strong>Նախագիծ:</strong> {verificationResult.data?.projectName}</p>
                      <p><strong>Կատեգորիա:</strong> {verificationResult.data?.category}</p>
                      <p><strong>Ներդրող:</strong> {verificationResult.data?.user?.name}</p>
                      <p><strong>Տրված է:</strong> {verificationResult.data?.mergedAt ? new Date(verificationResult.data.mergedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExternalLink className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-medium text-red-900">Վկայագիրը չի գտնվել կամ անվավեր է</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Վկայագրերը բեռնվում են...</p>
          </div>
        )}

        {/* Certificates Grid */}
        {!loading && certificates?.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(certificate.category)}
                      <div>
                        <CardTitle className="text-lg">{certificate.projectName}</CardTitle>
                        <p className="text-sm text-gray-500">{certificate.githubRepo}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-orange-600">
                      {certificate.certificateType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Certificate Info */}
                    <div>
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <Calendar className="h-4 w-4" />
                          <span>Տրված է: {new Date(certificate.mergedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-4 w-4" />
                          <span>Կատեգորիա: {certificate.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Code */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Վավերացման կոդ</div>
                      <div className="font-mono text-sm font-medium">{certificate.verificationCode}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <a 
                        href={certificate.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-orange-600 text-sm"
                      >
                        <Github className="h-4 w-4 mr-1" />
                        Տեսնել PR
                      </a>
                      
                      <button 
                        onClick={() => handleDownloadCertificate(certificate)}
                        className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium"
                        title="Download certificate PDF"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Ներբեռնել PDF
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && certificates?.length === 0 && (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Վկայագրեր դեռ չեն վաստակվել</h3>
            <p className="text-gray-600 mb-6">
              Ավարտեք թարգմանության նախագծեր վկայագրեր վաստակելու համար
            </p>
            <Link href="/projects">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Browse Projects
              </Button>
            </Link>
          </div>
        )}

        {/* Statistics */}
        {!loading && certificates?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Վկայագրի վարկածներ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">{certificates?.length}</div>
                  <div className="text-sm text-gray-600">Ընդհանուր վկայագրեր</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {new Set(certificates.map(c => c.category)).size}
                  </div>
                  <div className="text-sm text-gray-600">Կատեգորիաներ</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {new Set(certificates.map(c => c.githubRepo)).size}
                  </div>
                  <div className="text-sm text-gray-600">Նախագծեր</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {certificates.filter(c => c.certificateType === 'translation')?.length}
                  </div>
                  <div className="text-sm text-gray-600">թարգմանության վկայագրեր</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificate Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Վկայագրերի մասին</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🏆 Համարեք վկայագրեր</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Մատուցեք թարգմանության նախագծեր</li>
                  <li>• Կանխավարկեք կիբեռանվտանգության մասնագիտականների վերլուծություն</li>
                  <li>• Ներկառուցեք համագործակցություն</li>
                  <li>• Մասնագիտական զարգացում</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✅ Վավերացում</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Լրացուցիչ վկայագրերը ունեն հատուկ կոդ</li>
                  <li>• Վավերացվում է մեր համակարգով</li>
                  <li>• Հղված է գիտելիքների հետ</li>
                  <li>• Հաստատված հասկացություն</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📄 Վկայագրերի տեսակներ</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>թարգմանություն:</strong> Մատուցված թարգմանությունների համար</li>
                  <li>• <strong>վերլուծություն:</strong> Մասնագիտական վերլուծությունների համար</li>
                  <li>• <strong>համագործակցություն:</strong> համագործակցությունների համար</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 Օգտակարություն</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Մասնագիտական հայտարարություն</li>
                  <li>• Պորտֆոլիով զարգացում</li>
                  <li>• Համագործակցություն</li>
                  <li>• Մասնագիտական զարգացում</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 