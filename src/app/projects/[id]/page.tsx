'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CyberSecProject } from "@/data/mockData";
import { BookOpen, Github, ArrowLeft, ArrowRight, FileText, Clock, Shield, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ProjectWithContent extends CyberSecProject {
  documentationContent: string;
  availableDocuments: string[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [documentContent, setDocumentContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found. The project may have been removed or the link is incorrect.');
          } else {
            setError('Failed to load project. Please try again later.');
          }
          return;
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setProject(result.data);
          const firstDocument = result.data.availableDocuments[0];
          setSelectedDocument(firstDocument);
          setDocumentContent(getDocumentContent(firstDocument));
          setError(null);
        } else {
          setError('Project not found or invalid project data.');
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  // Function to get document content based on the selected document
  const getDocumentContent = (documentPath: string): string => {
    // Simulate different content for different documents
    const documentContents: { [key: string]: string } = {
      '/docs/01-injection.md': `# Injection Flaws

Injection flaws, such as SQL, NoSQL, OS, and LDAP injection, occur when untrusted data is sent to an interpreter as part of a command or query. The attacker's hostile data can trick the interpreter into executing unintended commands or accessing data without proper authorization.

## Common Types of Injection

### SQL Injection
SQL injection occurs when malicious SQL code is inserted into application queries.

Example vulnerable code:
\`\`\`sql
SELECT * FROM users WHERE id = '\${userId}'
\`\`\`

### NoSQL Injection
Similar to SQL injection but targets NoSQL databases like MongoDB.

### OS Command Injection
Occurs when user input is passed to system shell commands.

## Prevention Techniques

1. **Use Parameterized Queries**: Always use prepared statements
2. **Input Validation**: Validate all user inputs
3. **Least Privilege**: Run applications with minimal permissions
4. **Escape Special Characters**: Properly escape user input`,

      '/docs/02-authentication.md': `# Authentication and Session Management

Authentication and session management are critical security controls. Weaknesses in these areas can lead to unauthorized access to user accounts and sensitive data.

## Common Authentication Vulnerabilities

### Weak Password Requirements
- No complexity requirements
- No minimum length
- Common passwords allowed

### Session Management Issues
- Session tokens not properly randomized
- Sessions don't expire
- Session fixation vulnerabilities

### Multi-Factor Authentication
Implementing MFA significantly reduces authentication risks:
- SMS-based (less secure)
- App-based (TOTP)
- Hardware tokens (most secure)

## Best Practices

1. **Strong Password Policies**
2. **Account Lockout Mechanisms**
3. **Session Timeout**
4. **Secure Session Storage**
5. **Regular Security Audits**`,

      '/docs/03-sensitive-data.md': `# Sensitive Data Exposure

Many applications don't properly protect sensitive data like financial information, healthcare records, or personal information. This can lead to data breaches and privacy violations.

## Data Classification

### Public Data
- Marketing materials
- Public documentation
- General company information

### Internal Data
- Employee directories
- Internal procedures
- Business plans

### Confidential Data
- Customer information
- Financial records
- Trade secrets

### Restricted Data
- Personal health information
- Payment card data
- Government classified information

## Protection Strategies

1. **Data Encryption**
   - At rest encryption
   - In transit encryption
   - End-to-end encryption

2. **Access Controls**
   - Role-based access
   - Principle of least privilege
   - Regular access reviews

3. **Data Masking**
   - Production data masking
   - Test data anonymization
   - Dynamic data masking`,

      '/docs/04-xml-entities.md': `# XML External Entity (XXE) Attacks

XXE attacks occur when XML input containing a reference to an external entity is processed by a weakly configured XML parser. This can lead to disclosure of confidential data, denial of service, and server-side request forgery.

## How XXE Works

XML parsers can process external entities, which can be exploited:

\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>
  <data>&xxe;</data>
</root>
\`\`\`

## Types of XXE Attacks

### File Disclosure
Reading local files from the server

### Server-Side Request Forgery (SSRF)
Making requests to internal services

### Denial of Service
Causing resource exhaustion

## Prevention Methods

1. **Disable XML External Entity Processing**
2. **Use Simple Data Formats** (JSON instead of XML)
3. **Input Validation**
4. **Web Application Firewalls**
5. **Regular Security Testing**`,

      '/docs/05-broken-access.md': `# Broken Access Control

Access control enforces policies that restrict users from acting outside their intended permissions. Failures commonly lead to unauthorized disclosure, modification, or destruction of data.

## Common Access Control Vulnerabilities

### Vertical Privilege Escalation
- Regular users gaining admin privileges
- Bypassing authorization checks

### Horizontal Privilege Escalation
- Accessing other users' data
- Modifying other users' accounts

### Insecure Direct Object References
- Predictable resource identifiers
- Missing authorization checks

## Access Control Models

### Role-Based Access Control (RBAC)
- Users assigned to roles
- Roles have specific permissions
- Simplifies permission management

### Attribute-Based Access Control (ABAC)
- More flexible than RBAC
- Uses attributes for decisions
- Context-aware access control

## Implementation Guidelines

1. **Deny by Default**
2. **Implement Proper Authorization**
3. **Use Centralized Access Control**
4. **Regular Access Reviews**
5. **Logging and Monitoring**`
    };

    return documentContents[documentPath] || `# ${documentPath}

This document contains technical documentation that needs to be translated into Armenian. The content will focus on cybersecurity best practices, vulnerability descriptions, and prevention techniques.

## Document Overview

This documentation covers important security concepts and implementation guidelines for developers and security professionals.

## Translation Guidelines

When translating this document:
- Maintain technical accuracy
- Use consistent terminology
- Preserve code examples
- Keep formatting intact
- Ensure clarity for Armenian readers

## Technical Terms

Many cybersecurity terms may need to be adapted for Armenian readers while maintaining their technical meaning.`;
  };

  // Function to handle document selection
  const handleDocumentSelect = (documentPath: string) => {
    setSelectedDocument(documentPath);
    setDocumentContent(getDocumentContent(documentPath));
  };

  const handleStartTranslation = async () => {
    if (!project) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          documentPath: selectedDocument,
          originalContent: documentContent
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/translate/${result.data.id}`);
      } else {
        console.error('Failed to create translation project');
      }
    } catch (error) {
      console.error('Error starting translation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">Project not found</p>
          <Link href="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Armenian CyberSec Docs</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Project</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Link href="/projects">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Back to Projects
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Project Content */}
        {project && !loading && !error && (
          <>
            {/* Project Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center space-x-4">
                <Badge className={getDifficultyColor(project.difficulty)}>
                  {project.difficulty}
                </Badge>
                <Badge variant="secondary">
                  {project.category.replace('-', ' ')}
                </Badge>
                <span className="text-sm text-gray-500">by {project.owner}</span>
              </div>
            </div>
            <div className="text-right">
              {project.availableForTranslation ? (
                <Button 
                  onClick={handleStartTranslation}
                  className="bg-orange-600 hover:bg-orange-700"
                  size="lg"
                  title="Begin translating this project to Armenian"
                >
                  Start Translation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  disabled 
                  size="lg"
                  title="This project has been fully translated"
                >
                  Translation Complete
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Translation Progress</span>
              <span>{project.translationProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-orange-600 h-3 rounded-full transition-all"
                style={{ width: `${project.translationProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{project.estimatedHours}</div>
              <div className="text-sm text-gray-600">Estimated Hours</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{project.availableDocuments.length}</div>
              <div className="text-sm text-gray-600">Documents</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{project.translationProgress}%</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Github className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-gray-900">
                <a 
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  View Repo
                </a>
              </div>
              <div className="text-sm text-gray-600">GitHub</div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document List */}
          <Card>
            <CardHeader>
              <CardTitle>Available Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {project.availableDocuments.map((doc, index) => (
                  <button
                    key={index}
                    onClick={() => handleDocumentSelect(doc)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDocument === doc 
                        ? 'bg-orange-50 border-orange-200 text-orange-900' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">{doc.split('/').pop()}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{doc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentation Content */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Documentation Preview</CardTitle>
                <Badge variant="outline">{selectedDocument.split('/').pop()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {documentContent}
                </pre>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>📝 This is the original documentation that needs to be translated into Armenian.</p>
                <p>🔒 Cybersecurity terminology requires precise translation to maintain accuracy.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Translation Guidelines */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Translation Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📚 Cybersecurity Terms</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keep technical terms consistent across translations</li>
                  <li>• Use established Armenian cybersecurity vocabulary</li>
                  <li>• Provide transliteration for new terms when needed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✍️ Style & Format</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maintain original formatting and structure</li>
                  <li>• Preserve code examples and command syntax</li>
                  <li>• Keep URLs and references intact</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🔍 Review Process</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Translations reviewed by security experts</li>
                  <li>• Focus on technical accuracy and clarity</li>
                  <li>• GitHub PR submitted after approval</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🏆 Recognition</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Certificate issued after PR merge</li>
                  <li>• Contributor credit in repository</li>
                  <li>• Recognition in Armenian tech community</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
} 