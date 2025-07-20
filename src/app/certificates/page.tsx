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
            <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-orange-600">Dashboard</Link>
            <Link href="/projects" className="text-gray-600 hover:text-orange-600">Projects</Link>
            <Link href="/certificates" className="text-orange-600 font-medium">Certificates</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Certificates</h1>
          <p className="text-gray-600">View and verify your cybersecurity translation certificates</p>
        </div>

        {/* Certificate Verification */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Verify Certificate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code (e.g., CYBS-CERT-2025-001)"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Button 
                onClick={handleVerifyCertificate}
                disabled={!verificationCode.trim() || verifying}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {verifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            
            {verificationResult && (
              <div className="mt-4">
                {verificationResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Certificate Verified!</span>
                    </div>
                    <div className="space-y-1 text-sm text-green-800">
                      <p><strong>Project:</strong> {verificationResult.data?.projectName}</p>
                      <p><strong>Category:</strong> {verificationResult.data?.category}</p>
                      <p><strong>Contributor:</strong> {verificationResult.data?.user?.name}</p>
                      <p><strong>Issued:</strong> {verificationResult.data?.mergedAt ? new Date(verificationResult.data.mergedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExternalLink className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-medium text-red-900">Certificate not found or invalid</span>
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
            <p className="text-gray-600">Loading certificates...</p>
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
                          <span>Issued: {new Date(certificate.mergedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-4 w-4" />
                          <span>Category: {certificate.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Code */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Verification Code</div>
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
                        View PR
                      </a>
                      
                      <button 
                        onClick={() => handleDownloadCertificate(certificate)}
                        className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium"
                        title="Download certificate PDF"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates yet</h3>
            <p className="text-gray-600 mb-6">
              Start translating cybersecurity documentation to earn your first certificate!
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
              <CardTitle>Certificate Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">{certificates?.length}</div>
                  <div className="text-sm text-gray-600">Total Certificates</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {new Set(certificates.map(c => c.category)).size}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {new Set(certificates.map(c => c.githubRepo)).size}
                  </div>
                  <div className="text-sm text-gray-600">Projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {certificates.filter(c => c.certificateType === 'translation')?.length}
                  </div>
                  <div className="text-sm text-gray-600">Translation Certs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Certificate Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🏆 How to Earn</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Complete a translation project</li>
                  <li>• Pass cybersecurity expert review</li>
                  <li>• Submit successful GitHub PR</li>
                  <li>• Get your PR merged by maintainers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✅ Verification</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Each certificate has a unique code</li>
                  <li>• Verifiable through our platform</li>
                  <li>• Linked to GitHub contributions</li>
                  <li>• Permanent record of achievement</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📄 Certificate Types</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Translation:</strong> For completed translations</li>
                  <li>• <strong>Review:</strong> For expert reviews</li>
                  <li>• <strong>Contribution:</strong> For community help</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 Benefits</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Professional recognition</li>
                  <li>• Portfolio enhancement</li>
                  <li>• Community building</li>
                  <li>• Career advancement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 