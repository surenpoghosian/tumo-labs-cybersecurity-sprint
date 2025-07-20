'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Folder, 
  FolderOpen,
  GitBranch,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { FirestoreFile } from '@/lib/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface FolderNode {
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderNode[];
  file?: FirestoreFile;
  size?: number;
  fileCount?: number;
}

interface FolderBrowserProps {
  files: FirestoreFile[];
  onFileSelect: (file: FirestoreFile) => void;
  selectedFileId?: string;
  showFileStats?: boolean;
  allowFileActions?: boolean;
}

export function FolderBrowser({ 
  files, 
  onFileSelect, 
  selectedFileId, 
  showFileStats = true,
  allowFileActions = true 
}: FolderBrowserProps) {
  const { user } = useAuth();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Build folder tree structure
  const folderTree = useMemo(() => {
    const root: FolderNode = {
      name: 'Documentation',
      path: 'root',
      type: 'folder',
      children: [],
      fileCount: 0,
    };

    const folderMap = new Map<string, FolderNode>();
    folderMap.set('root', root);

    // Sort files by path for consistent ordering
    const sortedFiles = [...files].sort((a, b) => a.filePath.localeCompare(b.filePath));

    sortedFiles.forEach(file => {
      const pathParts = file.filePath.split('/');
      let currentPath = 'root';
      let currentNode = root;

      // Create folder structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        const folderPath = currentPath === 'root' ? folderName : `${currentPath}/${folderName}`;

        if (!folderMap.has(folderPath)) {
          const folderNode: FolderNode = {
            name: folderName,
            path: folderPath,
            type: 'folder',
            children: [],
            fileCount: 0,
          };

          folderMap.set(folderPath, folderNode);
          currentNode.children!.push(folderNode);
        }

        currentNode = folderMap.get(folderPath)!;
        currentPath = folderPath;
      }

      // Add file to the current folder
      const fileName = pathParts[pathParts.length - 1];
      const fileNode: FolderNode = {
        name: fileName,
        path: file.filePath,
        type: 'file',
        file: file,
        size: file.fileSize || 0,
      };

      currentNode.children!.push(fileNode);
    });

    // Calculate folder statistics
    const calculateFolderStats = (node: FolderNode): void => {
      if (node.type === 'folder' && node.children) {
        let totalFiles = 0;
        let totalSize = 0;

        node.children.forEach(child => {
          if (child.type === 'file') {
            totalFiles++;
            totalSize += child.size || 0;
          } else if (child.type === 'folder') {
            calculateFolderStats(child);
            totalFiles += child.fileCount || 0;
            totalSize += child.size || 0;
          }
        });

        node.fileCount = totalFiles;
        node.size = totalSize;
      }
    };

    calculateFolderStats(root);
    return root;
  }, [files]);

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not taken': { variant: 'secondary' as const, icon: FileText, label: 'Available' },
      'in progress': { variant: 'default' as const, icon: Zap, label: 'In Progress' },
      'pending': { variant: 'outline' as const, icon: Clock, label: 'Pending Review' },
      'rejected': { variant: 'destructive' as const, icon: AlertCircle, label: 'Rejected' },
      'accepted': { variant: 'default' as const, icon: CheckCircle, label: 'Accepted' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['not taken'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderNode = (node: FolderNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = node.file && selectedFileId === node.file.id;

    if (node.type === 'folder') {
      return (
        <div key={node.path}>
          <div 
            className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 rounded-md transition-colors ${depth > 0 ? 'ml-' + (depth * 4) : ''}`}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )}
            <span className="font-medium text-gray-900">{node.name}</span>
            {showFileStats && (
              <div className="flex items-center gap-2 ml-auto">
                <Badge variant="outline" className="text-xs">
                  {node.fileCount} files
                </Badge>
                {node.size && (
                  <Badge variant="outline" className="text-xs">
                    {formatFileSize(node.size)}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {isExpanded && node.children && (
            <div className="ml-2">
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // File node
    const isAssignedToMe = node.file?.assignedTranslatorId === user?.uid;
    
    return (
      <div 
        key={node.path}
        className={`flex items-center gap-2 p-2 cursor-pointer rounded-md transition-colors ${
          depth > 0 ? 'ml-' + (depth * 4) : ''
        } ${
          isSelected 
            ? 'bg-orange-50 border border-orange-200' 
            : isAssignedToMe 
              ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' 
              : 'hover:bg-gray-50'
        }`}
        onClick={() => node.file && onFileSelect(node.file)}
      >
        <div className="w-4 h-4" /> {/* Spacer for alignment */}
        <FileText className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-900 flex-1">{node.name}</span>
        
        {showFileStats && node.file && (
          <div className="flex items-center gap-2">
            {getStatusBadge(node.file.status)}
            
            {node.file.assignedTranslatorId && (
              <Badge 
                variant="outline" 
                className={`text-xs ${isAssignedToMe ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}`}
              >
                <User className="h-3 w-3 mr-1" />
                {isAssignedToMe ? 'My File' : 'Assigned'}
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs">
              {node.file.wordCount} words
            </Badge>
            
            {node.file.estimatedHours && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {node.file.estimatedHours}h
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  const totalStats = useMemo(() => {
    const stats = {
      total: files.length,
      available: files.filter(f => f.status === 'not taken').length,
      inProgress: files.filter(f => f.status === 'in progress').length,
      pending: files.filter(f => f.status === 'pending').length,
      accepted: files.filter(f => f.status === 'accepted').length,
      totalWords: files.reduce((sum, f) => sum + f.wordCount, 0),
      totalHours: files.reduce((sum, f) => sum + f.estimatedHours, 0),
    };
    return stats;
  }, [files]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Project Documents
          </CardTitle>
          {showFileStats && (
            <div className="flex gap-2">
              <Badge variant="outline">{totalStats.total} files</Badge>
              <Badge variant="outline">{totalStats.totalWords.toLocaleString()} words</Badge>
              <Badge variant="outline">{totalStats.totalHours}h estimated</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No documents found in this project.</p>
            <p className="text-sm">Sync with GitHub repository to import documentation.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {folderTree.children?.map(child => renderNode(child))}
          </div>
        )}
        
        {showFileStats && files.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-600">{totalStats.available}</div>
                <div className="text-gray-500">Available</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">{totalStats.inProgress}</div>
                <div className="text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">{totalStats.pending}</div>
                <div className="text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-600">{totalStats.accepted}</div>
                <div className="text-gray-500">Accepted</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-900">{Math.round((totalStats.accepted / totalStats.total) * 100)}%</div>
                <div className="text-gray-500">Complete</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 