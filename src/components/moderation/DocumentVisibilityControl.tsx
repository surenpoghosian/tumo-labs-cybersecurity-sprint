'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Eye, 
  Globe, 
  Lock, 
  Settings, 
  ExternalLink,
  Save,
  X,
  FileText,
  Search
} from 'lucide-react';
import { FirestoreFile } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

interface DocumentVisibilityControlProps {
  file: FirestoreFile;
  onUpdate: (fileId: string, updates: Partial<FirestoreFile>) => void;
  onClose?: () => void;
}

export function DocumentVisibilityControl({ 
  file, 
  onUpdate, 
  onClose 
}: DocumentVisibilityControlProps) {
  const { user } = useAuth();
  const alertMsg = useTranslations('AlertMessages');
  const labels = useTranslations('Labels');
  const placeholders = useTranslations('Placeholders');
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>(
    file.visibility || 'public'
  );
  const [seoTitle, setSeoTitle] = useState(file.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(file.seoDescription || '');
  const [seoKeywords, setSeoKeywords] = useState(
    file.seoKeywords ? file.seoKeywords.join(', ') : ''
  );

  const getVisibilityConfig = (vis: string) => {
    const configs = {
      public: {
        icon: Globe,
        label: 'Public',
        description: 'Visible to everyone and indexed by search engines',
        color: 'green',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800'
      },
      unlisted: {
        icon: Eye,
        label: 'Unlisted',
        description: 'Accessible via direct link but not indexed or listed publicly',
        color: 'yellow',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800'
      },
      private: {
        icon: Lock,
        label: 'Private',
        description: 'Only accessible to moderators and administrators',
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      }
    };
    return configs[vis as keyof typeof configs] || configs.public;
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const token = await user.getIdToken();
      
      const updates: Partial<FirestoreFile> = {
        visibility,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        seoKeywords: seoKeywords.trim() 
          ? seoKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
          : undefined,
        publishedAt: visibility === 'public' && file.visibility !== 'public' 
          ? new Date().toISOString() 
          : file.publishedAt
      };

      const response = await fetch(`/api/files/${file.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        onUpdate(file.id, updates);
        setIsOpen(false);
        // Show success notification
        if (window.alert) {
  window.alert(alertMsg('success.documentVisibilityUpdated'));
        }
      } else {
        throw new Error('Failed to update document');
      }
    } catch (error) {
      console.error('Error updating document visibility:', error);
      if (window.alert) {
window.alert(alertMsg('error.documentVisibilityFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const currentConfig = getVisibilityConfig(file.visibility || 'public');
  const CurrentIcon = currentConfig.icon;

  const generateUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/docs/project/${file.id}`;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`${currentConfig.bgColor} ${currentConfig.borderColor} ${currentConfig.textColor} hover:opacity-80`}
      >
        <CurrentIcon className="h-4 w-4 mr-2" />
        {currentConfig.label}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Document Visibility & SEO
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Document Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{file.fileName}</h4>
                    <p className="text-sm text-gray-500">{file.filePath}</p>
                    <div className="flex items-center gap-2 mt-2">
      <Badge variant="outline">{file.wordCount} {labels('words')}</Badge>
                      <Badge variant="secondary">{file.status}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visibility Options */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Visibility Settings</h3>
              <div className="space-y-3">
                {(['public', 'unlisted', 'private'] as const).map((vis) => {
                  const config = getVisibilityConfig(vis);
                  const Icon = config.icon;
                  
                  return (
                    <div
                      key={vis}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        visibility === vis 
                          ? `${config.bgColor} ${config.borderColor}` 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setVisibility(vis)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            checked={visibility === vis}
                            onChange={() => setVisibility(vis)}
                            className="mr-3"
                          />
                          <Icon className={`h-5 w-5 ${visibility === vis ? config.textColor : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{config.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{config.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEO Settings (only for public/unlisted) */}
            {visibility !== 'private' && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  SEO Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder={`${file.fileName} - Armenian Translation`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      maxLength={60}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {seoTitle.length}/60 characters (recommended: 50-60)
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Description
                    </label>
                    <textarea
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
  placeholder={placeholders('armenianTranslation')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      maxLength={160}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {seoDescription.length}/160 characters (recommended: 150-160)
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SEO Keywords
                    </label>
                    <input
                      type="text"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
  placeholder={placeholders('searchKeywords')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Separate keywords with commas
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview URL */}
            {visibility !== 'private' && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Public URL</h3>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-mono text-gray-600 flex-1">
                    {generateUrl()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(generateUrl(), '_blank')}
                  >
                    Preview
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 