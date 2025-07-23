import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Hash } from 'lucide-react';
import { FirestoreFile } from '@/lib/firestore';

interface FilePreviewDialogProps {
  file: FirestoreFile | null;
  open: boolean;
  onClose: () => void;
}

export function FilePreviewDialog({ file, open, onClose }: FilePreviewDialogProps) {
  if (!file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getPreviewText = (text: string, maxLength: number = 5000) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '\n\n... (content truncated for preview)';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* File Info Header */}
          <div className="flex-shrink-0 bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{file.fileName}</h3>
                <p className="text-sm text-gray-500">{file.filePath}</p>
              </div>
              <Badge 
                variant={file.status === 'not taken' ? 'secondary' : 'default'}
                className="ml-2"
              >
                {file.status.replace('-', ' ')}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Words:</span>
                <span className="font-medium">{file.wordCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Est. Time:</span>
                <span className="font-medium">{file.estimatedHours}h</span>
              </div>
              {file.fileSize && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{formatFileSize(file.fileSize)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Folder:</span>
                <span className="font-medium text-xs">
                  {file.folderPath || file.filePath.split('/').slice(0, -1).join('/') || 'Root'}
                </span>
              </div>
            </div>
          </div>

          {/* Content Area - Fixed height layout */}
          <div className="flex-1 flex flex-col min-h-0 gap-4">
            {/* File Content */}
            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="font-medium text-gray-900 mb-2 flex-shrink-0">Original Content</h4>
              <div className="flex-1 overflow-auto bg-white border rounded-lg min-h-0">
                <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                  {getPreviewText(file.originalText)}
                </pre>
              </div>
            </div>

            {/* Translated Content (if exists) */}
            {file.translatedText && file.translatedText.trim() && (
              <div className="flex-1 flex flex-col min-h-0">
                <h4 className="font-medium text-gray-900 mb-2 flex-shrink-0">Current Translation</h4>
                <div className="flex-1 overflow-auto bg-orange-50 border border-orange-200 rounded-lg min-h-0">
                  <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
                    {getPreviewText(file.translatedText)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex-shrink-0 pt-4 border-t text-xs text-gray-500">
          <p>
            This preview shows the first 5,000 characters of the file content. 
            The full content will be available in the translation editor.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 