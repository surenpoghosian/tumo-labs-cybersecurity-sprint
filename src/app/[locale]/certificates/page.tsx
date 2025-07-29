'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Certificate } from "@/data/mockData";
import { BookOpen, Award, Download, ExternalLink, Search, Calendar, Shield, Trophy, CheckCircle, FileBadge, Target } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import AppHeader from '@/components/ui/AppHeader';

interface VerificationResult {
  success: boolean;
  certificate?: Certificate;
  data?: {
    projectName: string;
    category: string;
    certificateType: string;
    verificationCode: string;
    issuedDate: string;
    holderName: string;
    isValid: boolean;
    verifiedAt: string;
  };
  error?: string;
}

export default function CertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const certificate_ = useTranslations("Certificates");
  const navigation = useTranslations("Navigation");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        // Prepare headers - include auth token if user is logged in
        const headers: Record<string, string> = {};
        if (user) {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/certificates', {
          headers
        });

        const result = await response.json();

        if (!response.ok) {
          console.error('Certificates API error:', result);
          // Don't set error state - just log and continue with empty certificates
          setCertificates([]);
        } else {
          setCertificates(result.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch certificates:', err);
        // Don't set error state for network issues - just continue with empty certificates
        setCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

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
      const token = user ? await user.getIdToken() : null;
      const response = await fetch(`/api/certificates/download/${filename}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

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
      <AppHeader currentPage="certificates" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{navigation("certificates")}</h1>
          <p className="text-gray-600 text-lg">Earn recognition for your work and track your achievements</p>
        </div>

        {/* Certificate Verification */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{certificate_("verify.title")}</CardTitle>
            <p className="text-sm text-gray-600">Enter a verification code to confirm a certificate&apos;s authenticity. Only public information is shown for privacy protection.</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={certificate_("verify.placeholder")}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <Button
                onClick={handleVerifyCertificate}
                disabled={!verificationCode.trim() || verifying}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Search className="h-4 w-4 mr-2" />
                {verifying ? certificate_("verify.verifying") : certificate_("verify.button")}
              </Button>
            </div>

            {verificationResult && (
              <div className="mt-4">
                {verificationResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">{certificate_("verify.success")}</span>
                    </div>
                    <div className="space-y-1 text-sm text-green-800">
                      <p><strong>{certificate_("verify.project")}:</strong> {verificationResult.data?.projectName}</p>
                      <p><strong>{certificate_("verify.category")}:</strong> {verificationResult.data?.category}</p>
                      <p><strong>Certificate Type:</strong> {verificationResult.data?.certificateType}</p>
                      <p><strong>Holder:</strong> {verificationResult.data?.holderName}</p>
                      <p><strong>{certificate_("verify.issued")}:</strong> {verificationResult.data?.issuedDate ? new Date(verificationResult.data.issuedDate).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>{certificate_("certificateCard.verificationCode")}:</strong> {verificationResult.data?.verificationCode}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <ExternalLink className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-medium text-red-900">{certificate_("notFound")}</span>
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
                          <span>{certificate_("verify.issued")}: {certificate.mergedAt ? new Date(certificate.mergedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-4 w-4" />
                          <span>{certificate_("verify.category")}: {certificate.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification Code */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">{certificate_("certificateCard.verificationCode")}</div>
                      <div className="font-mono text-sm font-medium">{certificate.verificationCode}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      {/* <a 
                        href={certificate.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-orange-600 text-sm"
                      >
                        <Github className="h-4 w-4 mr-1" />
                        View PR
                      </a> */}

                      <button
                        onClick={() => handleDownloadCertificate(certificate)}
                        className="flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium"
                        title="Download certificate PDF"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {certificate_("certificateCard.downloadPDF")}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty States */}
        {!loading && certificates?.length === 0 && (
          <div className="text-center py-16">
            <Award className="h-14 w-14 text-orange-300 mx-auto mb-4" />
            {user ? (
              <>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{certificate_("noCertificates.title")}</h4>
                <p className="text-gray-600 mb-4">{certificate_("noCertificates.description")}</p>
                <Link href="/projects" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors">
                  <BookOpen className="h-4 w-4" /> Explore Projects
                </Link>
              </>
            ) : (
              <>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Earn certificates by contributing!</h4>
                <p className="text-gray-600 mb-4">Create an account and start translating to collect achievements.</p>
                <Link href="/auth/register" className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors">
                  <BookOpen className="h-4 w-4" /> Join & Contribute
                </Link>
              </>
            )}
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

        {/* Certificate Info
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
        </Card> */}

        {/* About Certificates */}
        <Card className="mb-12 bg-white/60 backdrop-blur-sm border border-orange-100 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-orange-700"><Trophy className="h-6 w-6" />About Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm md:text-base text-gray-700">
              {/* How to earn */}
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-2 text-gray-900"><Trophy className="h-4 w-4 text-orange-600" /> How to Earn</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{certificate_("about.howToEarn.steps.0")}</li>
                  <li>{certificate_("about.howToEarn.steps.1")}</li>
                  <li>{certificate_("about.howToEarn.steps.2")}</li>
                  <li>{certificate_("about.howToEarn.steps.3")}</li>
                </ul>
              </div>
              {/* Verification */}
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-2 text-gray-900"><CheckCircle className="h-4 w-4 text-green-600" /> Verification</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Unique code for every certificate</li>
                  <li>Verifiable directly on our platform</li>
                  <li>Linked to your GitHub contributions</li>
                  <li>Permanent publicly-viewable record</li>
                </ul>
              </div>
              {/* Types */}
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-2 text-gray-900"><FileBadge className="h-4 w-4 text-blue-600" /> Certificate Types</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Translation – completed translations</li>
                  <li>Review – expert reviews</li>
                  <li>Contribution – community help</li>
                </ul>
              </div>
              {/* Benefits */}
              <div>
                <h3 className="flex items-center gap-2 font-semibold mb-2 text-gray-900"><Target className="h-4 w-4 text-purple-600" /> Benefits</h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Professional recognition</li>
                  <li>Portfolio enhancement</li>
                  <li>Community building</li>
                  <li>Career advancement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 