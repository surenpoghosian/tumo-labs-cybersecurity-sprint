'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  GitBranch, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  FileText,
  Folder,
  ExternalLink
} from 'lucide-react';
import { FirestoreProject } from '@/lib/firestore';

interface SyncResult {
  success: boolean;
  message: string;
  syncedFiles: number;
  totalFiles: number;
  folderStructure: string[];
  errors?: string[];
  skipped?: boolean;
}

interface ProjectSyncProps {
  project: FirestoreProject;
  onSyncComplete: (result: SyncResult) => void;
  isProjectAdmin: boolean;
}

export function ProjectSync({ project, onSyncComplete, isProjectAdmin }: ProjectSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const handleSync = async (forceSync: boolean = false) => {
    if (!isProjectAdmin) {
      return;
    }

    setSyncing(true);
    setLastSyncResult(null);

    try {
      const response = await fetch('/api/projects/sync-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          githubUrl: project.source,
          forceSync,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setLastSyncResult(result);
        onSyncComplete(result);
      } else {
        setLastSyncResult({
          success: false,
          message: result.error || 'Sync failed',
          syncedFiles: 0,
          totalFiles: 0,
          folderStructure: [],
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      setLastSyncResult({
        success: false,
        message: 'Network error occurred during sync',
        syncedFiles: 0,
        totalFiles: 0,
        folderStructure: [],
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSyncTime = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const getSyncStatusBadge = () => {
    if (syncing) {
      return (
        <Badge variant="outline" className="animate-pulse">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Syncing...
        </Badge>
      );
    }

    if (lastSyncResult) {
      if (lastSyncResult.success) {
        if (lastSyncResult.skipped) {
          return (
            <Badge variant="secondary">
              <CheckCircle className="h-3 w-3 mr-1" />
              Up to date
            </Badge>
          );
        }
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sync completed
          </Badge>
        );
      } else {
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Sync failed
          </Badge>
        );
      }
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Repository Sync
          </CardTitle>
          {getSyncStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Repository Information */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-gray-500" />
            <div>
              <div className="font-medium text-gray-900">
                {project.source.replace('https://github.com/', '')}
              </div>
              <div className="text-sm text-gray-500">
                Last synced: {formatLastSyncTime(project.lastSyncedAt)}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(project.source, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Repo
          </Button>
        </div>

        {/* Sync Controls */}
        {isProjectAdmin ? (
          <div className="flex gap-2">
            <Button
              onClick={() => handleSync(false)}
              disabled={syncing}
              className="flex-1"
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {syncing ? 'Syncing...' : 'Sync Changes'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleSync(true)}
              disabled={syncing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Sync
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Only project administrators can sync documents from the repository.
              </span>
            </div>
          </div>
        )}

        {/* Last Sync Result */}
        {lastSyncResult && (
          <div className={`p-4 rounded-lg ${
            lastSyncResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {lastSyncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              
              <div className="flex-1">
                <div className={`font-medium ${
                  lastSyncResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {lastSyncResult.message}
                </div>
                
                {lastSyncResult.success && !lastSyncResult.skipped && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-4 text-sm text-green-700">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {lastSyncResult.syncedFiles} files synced
                      </div>
                      <div className="flex items-center gap-1">
                        <Folder className="h-4 w-4" />
                        {lastSyncResult.folderStructure?.length} folders
                      </div>
                    </div>
                    
                    {lastSyncResult.folderStructure?.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-green-700 mb-1">Folder structure:</div>
                        <div className="flex flex-wrap gap-1">
                          {lastSyncResult.folderStructure.map((folder, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {folder}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {lastSyncResult.errors && lastSyncResult.errors?.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-red-700 mb-1">Errors:</div>
                    <ul className="text-sm text-red-600 space-y-1">
                      {lastSyncResult.errors.map((error, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-red-400">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sync Information */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">How syncing works:</div>
            <ul className="space-y-1 text-blue-700">
              <li>• Documents are automatically discovered from docs/, documentation/, and doc/ folders</li>
              <li>• Only Markdown (.md), reStructuredText (.rst), and text files are imported</li>
              <li>• Files larger than 50KB are stored as references to GitHub raw content</li>
              <li>• Existing translations are preserved during sync</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 