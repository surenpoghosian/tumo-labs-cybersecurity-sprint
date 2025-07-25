import { NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/firebaseAdmin';
import { getFirestore } from '@/lib/firebaseAdmin';
import { GitHubDocumentManager } from '@/lib/github-integration';
import { FirestoreFile, FirestoreProject } from '@/lib/firestore';

export async function POST(request: Request) {
  try {
    const userId = await verifyAuthToken();
    const firestore = await getFirestore();

    const body = await request.json();
    const { projectId, githubUrl, forceSync = false } = body;

    if (!projectId || !githubUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, githubUrl' },
        { status: 400 }
      );
    }

    // Get project details
    const projectDoc = await firestore.collection('projects').doc(projectId).get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectDoc.data() as FirestoreProject;

    // Only allow project creators or admins to sync
    if (project.createdBy !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const githubManager = new GitHubDocumentManager();
    
    // Check if repository has changed since last sync (if not forcing)
    if (!forceSync && project.lastSyncSha) {
      const repoInfo = githubManager.parseGitHubUrl(githubUrl);
      if (repoInfo) {
        const hasChanged = await githubManager.hasRepositoryChanged(
          repoInfo.owner,
          repoInfo.repo,
          project.lastSyncSha
        );
        
        if (!hasChanged) {
          return NextResponse.json({
            success: true,
            message: 'Repository has not changed since last sync',
            syncedFiles: 0,
            skipped: true
          });
        }
      }
    }

    // Discover documentation files
    const documentationFiles = await githubManager.discoverDocumentationFiles(githubUrl);
    
    if (documentationFiles?.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No documentation files found in repository',
        syncedFiles: 0
      });
    }

    // Organize files by folder
    const folderStructure = githubManager.organizeFilesByFolder(documentationFiles);
    
    const syncedFiles: FirestoreFile[] = [];
    const errors: string[] = [];
    const batch = firestore.batch();

    // Process files in batches to avoid Firestore limits
    for (const [folderPath, files] of Object.entries(folderStructure)) {
      for (const file of files) {
        try {
          // Check if file already exists
          const existingFilesQuery = await firestore
            .collection('files')
            .where('projectId', '==', projectId)
            .where('filePath', '==', file.path)
            .get();

          let shouldCreateNew = true;
          let existingFileId: string | null = null;

          if (!existingFilesQuery.empty) {
            const existingFile = existingFilesQuery.docs[0].data();
            existingFileId = existingFilesQuery.docs[0].id;
            
            // Only update if GitHub SHA has changed or forcing sync
            if (forceSync || existingFile.githubSha !== file.sha) {
              shouldCreateNew = false; // Update existing instead
            } else {
              continue; // Skip unchanged file
            }
          }

          // Fetch file content
          const repoInfo = githubManager.parseGitHubUrl(githubUrl);
          if (!repoInfo) {
            errors.push(`Invalid GitHub URL: ${githubUrl}`);
            continue;
          }

          let fileContent: string;
          let storageType: 'firestore' | 'github_raw' = 'firestore';

          // Determine storage strategy based on file size
          if (file.size > 50 * 1024) { // > 50KB
            storageType = 'github_raw';
            fileContent = ''; // Store empty content, use download_url
          } else {
            fileContent = await githubManager.getFileContent(
              repoInfo.owner,
              repoInfo.repo,
              file.path
            );
          }

          // Calculate word count for estimations
          let wordCount = 0;
          if (storageType === 'github_raw') {
            // For large files, calculate word count from the actual content at download_url
            try {
              console.log(`Calculating word count from external URL: ${file.download_url}`);
              const response = await fetch(file.download_url);
              if (response.ok) {
                const content = await response.text();
                wordCount = content.trim().split(/\s+/).filter(word => word?.length > 0)?.length;
                console.log(`Calculated word count for large file: ${wordCount}`);
              } else {
                console.error('Failed to fetch content for word count:', response.status);
                wordCount = 0;
              }
            } catch (error) {
              console.error('Error fetching content for word count calculation:', error);
              wordCount = 0;
            }
          } else {
            // For small files, calculate from stored content
            wordCount = fileContent 
              ? fileContent.trim().split(/\s+/).filter(word => word?.length > 0)?.length
              : 0;
          }
          
          const estimatedHours = Math.max(0.5, Math.ceil(wordCount / 250));

          const fileData: Partial<FirestoreFile> = {
            ...(shouldCreateNew && {
              uId: userId,
              projectId: projectId,
              createdBy: userId,
              createdAt: new Date().toISOString(),
              status: 'not taken' as const,
              translations: [],
              translatedText: '',
              assignedTranslatorId: undefined,
              reviewerId: undefined,
              actualHours: 0,
            }),
            fileName: file.name,
            filePath: file.path,
            folderPath: folderPath,
            originalText: fileContent,
            storageType: storageType,
            contentUrl: storageType === 'github_raw' ? file.download_url : undefined,
            fileSize: file.size,
            githubSha: file.sha,
            wordCount: wordCount,
            estimatedHours: estimatedHours,
            updatedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString(),
          };

          if (shouldCreateNew) {
            // Create new file
            const newFileRef = firestore.collection('files').doc();
            batch.set(newFileRef, fileData);
            
            syncedFiles.push({
              id: newFileRef.id,
              ...fileData
            } as FirestoreFile);
          } else if (existingFileId) {
            // Update existing file
            const existingFileRef = firestore.collection('files').doc(existingFileId);
            batch.update(existingFileRef, fileData);
            
            syncedFiles.push({
              id: existingFileId,
              ...fileData
            } as FirestoreFile);
          }

        } catch (error) {
          console.error(`Error processing file ${file.path}:`, error);
          errors.push(`Failed to process ${file.path}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Update project with file IDs and sync info
    const fileIds = syncedFiles.map(f => f.id);
    const currentFileIds = project.files || [];
    const updatedFileIds = [...new Set([...currentFileIds, ...fileIds])];

    const projectUpdateData = {
      files: updatedFileIds,
      lastSyncedAt: new Date().toISOString(),
      lastSyncSha: documentationFiles[0]?.sha, // Use first file's SHA as reference
      updatedAt: new Date().toISOString(),
    };

    batch.update(firestore.collection('projects').doc(projectId), projectUpdateData);

    // Commit all changes
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedFiles?.length} files from repository`,
      syncedFiles: syncedFiles?.length,
      totalFiles: documentationFiles?.length,
      folderStructure: Object.keys(folderStructure),
      errors: errors?.length > 0 ? errors : undefined,
      data: {
        syncedFiles: syncedFiles.map(f => ({
          id: f.id,
          fileName: f.fileName,
          filePath: f.filePath,
          folderPath: f.folderPath,
          wordCount: f.wordCount,
          estimatedHours: f.estimatedHours,
          fileSize: f.fileSize,
        })),
        folderStructure
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Error syncing documents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync documents from repository',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 