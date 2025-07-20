// GitHub Repository Integration for Document Management
import { Octokit } from '@octokit/rest';

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  download_url: string;
  type: 'file' | 'dir';
  content?: string;
}



export class GitHubDocumentManager {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2].replace('.git', ''),
    };
  }

  /**
   * Discover all documentation files in a repository
   */
  async discoverDocumentationFiles(
    repoUrl: string,
    docsPaths: string[] = ['docs', 'documentation', 'doc']
  ): Promise<GitHubFile[]> {
    const parsed = this.parseGitHubUrl(repoUrl);
    if (!parsed) throw new Error('Invalid GitHub URL');

    const allFiles: GitHubFile[] = [];

    for (const docsPath of docsPaths) {
      try {
        const files = await this.getDirectoryContents(
          parsed.owner,
          parsed.repo,
          docsPath
        );
        allFiles.push(...files);
      } catch {
        console.log(`No ${docsPath} directory found in ${repoUrl}`);
      }
    }

    return this.filterDocumentationFiles(allFiles);
  }

  /**
   * Get contents of a directory recursively
   */
  async getDirectoryContents(
    owner: string,
    repo: string,
    path: string = ''
  ): Promise<GitHubFile[]> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      const items = Array.isArray(response.data) ? response.data : [response.data];
      const files: GitHubFile[] = [];

      for (const item of items) {
        if (item.type === 'file') {
          files.push({
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size || 0,
            download_url: item.download_url || '',
            type: 'file',
          });
        } else if (item.type === 'dir') {
          // Recursively get subdirectory contents
          const subFiles = await this.getDirectoryContents(owner, repo, item.path);
          files.push(...subFiles);
        }
      }

      return files;
    } catch (error) {
      console.error(`Error fetching directory ${path}:`, error);
      return [];
    }
  }

  /**
   * Filter files to only include documentation formats
   */
  private filterDocumentationFiles(files: GitHubFile[]): GitHubFile[] {
    const documentationExtensions = ['.md', '.rst', '.txt', '.adoc', '.asciidoc'];
    
    return files.filter(file => 
      documentationExtensions.some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );
  }

  /**
   * Get file content from GitHub
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string
  ): Promise<string> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(response.data)) {
        throw new Error('Path is a directory, not a file');
      }

      // Check if it's a file type before accessing content
      if (response.data.type === 'file' && 'content' in response.data && response.data.content) {
        return Buffer.from(response.data.content, 'base64').toString('utf8');
      }

      // For large files, fetch from download_url
      if (response.data.type === 'file' && response.data.download_url) {
        const contentResponse = await fetch(response.data.download_url);
        return await contentResponse.text();
      }

      throw new Error('No content available');
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Get repository tree structure
   */
 

  /**
   * Check if file is a documentation file
   */
  private isDocumentationFile(path: string): boolean {
    const documentationExtensions = ['.md', '.rst', '.txt', '.adoc', '.asciidoc'];
    const documentationPaths = ['docs/', 'documentation/', 'doc/', 'README'];
    
    return (
      documentationExtensions.some(ext => path.toLowerCase().endsWith(ext)) ||
      documentationPaths.some(docPath => path.toLowerCase().includes(docPath.toLowerCase()))
    );
  }

  /**
   * Organize files into folder structure
   */
  organizeFilesByFolder(files: GitHubFile[]): Record<string, GitHubFile[]> {
    const folderStructure: Record<string, GitHubFile[]> = {};

    files.forEach(file => {
      const folderPath = file.path.includes('/') 
        ? file.path.substring(0, file.path.lastIndexOf('/'))
        : 'root';

      if (!folderStructure[folderPath]) {
        folderStructure[folderPath] = [];
      }

      folderStructure[folderPath].push(file);
    });

    return folderStructure;
  }

  /**
   * Check if repository has changed since last sync
   */
  async hasRepositoryChanged(
    owner: string,
    repo: string,
    lastSyncSha?: string
  ): Promise<boolean> {
    try {
      const response = await this.octokit.rest.repos.get({ owner, repo });
      const currentSha = response.data.default_branch;
      
      if (!lastSyncSha) return true;
      
      const commits = await this.octokit.rest.repos.compareCommits({
        owner,
        repo,
        base: lastSyncSha,
        head: currentSha,
      });

      return commits.data.total_commits > 0;
    } catch (error) {
      console.error('Error checking repository changes:', error);
      return true; // Assume changed if error
    }
  }
} 