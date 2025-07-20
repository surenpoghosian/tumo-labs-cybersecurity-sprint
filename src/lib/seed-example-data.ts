/* eslint-disable @typescript-eslint/no-explicit-any */
// Seed script to populate Firestore with example projects and files for testing
import { getFirestore } from './firebaseAdmin';
import { FirestoreProject, FirestoreFile } from './firestore';

const exampleProjects: Omit<FirestoreProject, 'id'>[] = [
  {
    uId: 'example-admin', // This should be replaced with actual user ID
    title: 'OWASP Top 10 Security Guide',
    version: '2023.1',
    description: 'The OWASP Top 10 is a standard awareness document for developers and web application security.',
    developedBy: 'OWASP Foundation',
    difficulty: 2, // 1-5 scale
    source: 'https://github.com/OWASP/Top10',
    categories: ['web-security', 'application-security'],
    status: 'in progress',
    files: [], // Will be populated after creating files
    createdBy: 'example-admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedHours: 25,
    translationProgress: 35,
    availableForTranslation: true,
    lastSyncedAt: new Date().toISOString(),
  },
  {
    uId: 'example-admin',
    title: 'Cybersecurity Fundamentals',
    version: '1.2',
    description: 'A comprehensive guide to cybersecurity fundamentals covering basic security concepts, threats, and protection mechanisms.',
    developedBy: 'Security Learning Institute',
    difficulty: 1,
    source: 'https://github.com/security-institute/cybersec-fundamentals',
    categories: ['fundamentals', 'education'],
    status: 'not started',
    files: [],
    createdBy: 'example-admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedHours: 15,
    translationProgress: 0,
    availableForTranslation: true,
  },
  {
    uId: 'example-admin',
    title: 'Network Security Protocols',
    version: '2.0',
    description: 'Advanced documentation covering network security protocols, encryption, and secure communication methods.',
    developedBy: 'Network Security Team',
    difficulty: 4,
    source: 'https://github.com/netsec/protocols-guide',
    categories: ['network-security', 'protocols'],
    status: 'in progress',
    files: [],
    createdBy: 'example-admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedHours: 40,
    translationProgress: 60,
    availableForTranslation: true,
    lastSyncedAt: new Date().toISOString(),
  }
];

const exampleFiles: (projectIndex: number, projectId: string) => Omit<FirestoreFile, 'id'>[] = (projectIndex, projectId) => {
  const baseFiles = [
    // OWASP Top 10 files
    [
      {
        uId: 'example-admin',
        projectId,
        fileName: 'README.md',
        filePath: 'README.md',
        folderPath: 'root',
        originalText: `# OWASP Top 10 Web Application Security Risks

## Introduction

The OWASP Top 10 is a standard awareness document for developers and web application security. It represents a broad consensus about the most critical security risks to web applications.

## Purpose

This document provides:
- A ranking of the most critical web application security risks
- Descriptions of each risk category
- Examples of vulnerabilities
- Guidance on how to prevent these risks

## How to Use This Document

Security teams can use this document to:
1. Prioritize security efforts
2. Educate developers about security risks
3. Create security testing strategies
4. Establish security requirements

## Target Audience

- Application developers
- Security professionals
- DevOps teams
- IT managers
- Security consultants`,
        translatedText: '',
        status: 'not taken',
        translations: [],
        wordCount: 142,
        estimatedHours: 1,
        actualHours: 0,
        createdBy: 'example-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 1420,
        githubSha: 'abc123def456',
        lastSyncedAt: new Date().toISOString(),
      },
      {
        uId: 'example-admin',
        projectId,
        fileName: 'A01-injection.md',
        filePath: 'docs/A01-injection.md',
        folderPath: 'docs',
        originalText: `# A01:2021 – Injection

## Overview

Injection flaws, such as SQL, NoSQL, OS, and LDAP injection, occur when untrusted data is sent to an interpreter as part of a command or query. The attacker's hostile data can trick the interpreter into executing unintended commands or accessing data without proper authorization.

## Description

An application is vulnerable to attack when:
- User-supplied data is not validated, filtered, or sanitized by the application
- Dynamic queries or non-parameterized calls without context-aware escaping are used directly in the interpreter
- Hostile data is used within object-relational mapping (ORM) search parameters to extract additional, sensitive records
- Hostile data is directly used or concatenated, such that the SQL or command contains both structure and hostile data in dynamic queries, commands, or stored procedures

## Common Types

### SQL Injection
SQL injection occurs when malicious SQL code is inserted into application queries.

Example vulnerable code:
\`\`\`sql
SELECT * FROM users WHERE id = '\${userId}' AND password = '\${password}'
\`\`\`

### NoSQL Injection
Similar to SQL injection but targets NoSQL databases like MongoDB.

### OS Command Injection
Occurs when user input is passed to system shell commands without proper validation.

### LDAP Injection
Targets LDAP queries used for authentication and directory services.

## Prevention

1. **Use Parameterized Queries or Prepared Statements**
   - Always use parameterized queries for database interactions
   - Separate SQL code from data

2. **Input Validation**
   - Validate all user inputs against a whitelist
   - Use server-side validation

3. **Escape Special Characters**
   - Properly escape special characters in user input
   - Use context-specific escaping

4. **Least Privilege Principle**
   - Run applications with minimal database permissions
   - Avoid using administrative accounts for application connections

5. **Use Safe APIs**
   - Use APIs that avoid the interpreter entirely
   - Provide parameterized interfaces

## Example Attack Scenarios

### Scenario 1: SQL Injection
An application uses untrusted data in the construction of the following vulnerable SQL call:
\`\`\`sql
String query = "SELECT * FROM accounts WHERE custID='" + request.getParameter("id") + "'";
\`\`\`

### Scenario 2: Command Injection
A system administrator needs to execute commands on a server. The application calls:
\`\`\`java
Process p = Runtime.getRuntime().exec("sh -c 'some_cmd " + input + "'");
\`\`\`

## References

- [OWASP Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [CWE-79: Cross-site Scripting](https://cwe.mitre.org/data/definitions/79.html)`,
        translatedText: '',
        status: 'in progress',
        assignedTranslatorId: 'translator-1',
        translations: [],
        wordCount: 425,
        estimatedHours: 2,
        actualHours: 0,
        createdBy: 'example-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 4250,
        githubSha: 'def456ghi789',
        lastSyncedAt: new Date().toISOString(),
      },
      {
        uId: 'example-admin',
        projectId,
        fileName: 'A02-cryptographic-failures.md',
        filePath: 'docs/A02-cryptographic-failures.md',
        folderPath: 'docs',
        originalText: `# A02:2021 – Cryptographic Failures

## Overview

Previously known as Sensitive Data Exposure, cryptographic failures are a common cause of sensitive data exposure or system compromise. The focus is on failures related to cryptography which often leads to sensitive data exposure or system compromise.

## Description

The first thing is to determine the protection needs of data in transit and at rest. For example, passwords, credit card numbers, health records, personal information, and business secrets require extra protection, particularly if that data falls under privacy laws (EU GDPR, local privacy laws) or regulations (financial data protection such as PCI Data Security Standard).

## Common Weaknesses

### Weak or Outdated Algorithms
- Using deprecated cryptographic algorithms
- Insufficient key lengths
- Weak random number generation

### Poor Key Management
- Hard-coded encryption keys
- Weak key derivation
- Improper key storage
- Key reuse across environments

### Implementation Flaws
- Using encryption when authenticated encryption is needed
- Custom cryptographic implementations
- Poor certificate validation

## Prevention

1. **Classify Data**
   - Identify which data is sensitive
   - Apply controls per classification

2. **Don't Store Sensitive Data Unnecessarily**
   - Discard sensitive data as soon as possible
   - Use tokenization or truncation

3. **Encrypt All Sensitive Data at Rest**
   - Use strong encryption algorithms
   - Proper key management

4. **Encrypt All Data in Transit**
   - Use secure protocols (TLS, HTTPS)
   - Ensure proper certificate validation

5. **Use Strong Cryptographic Standards**
   - Use well-vetted algorithms
   - Proper implementation

## Example Attack Scenarios

### Scenario 1: Password Database
An application encrypts credit card numbers in a database using automatic database encryption. However, this data is automatically decrypted when retrieved, allowing a SQL injection flaw to retrieve credit card numbers in clear text.

### Scenario 2: Weak Encryption
A site doesn't use or enforce TLS for all pages or supports weak encryption. An attacker monitors network traffic, downgrades connections from HTTPS to HTTP, intercepts requests, and steals the user's session cookie.`,
        translatedText: '',
        status: 'accepted',
        assignedTranslatorId: 'translator-2',
        reviewerId: 'reviewer-1',
        translations: [],
        wordCount: 320,
        estimatedHours: 2,
        actualHours: 1.5,
        createdBy: 'example-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 3200,
        githubSha: 'ghi789jkl012',
        lastSyncedAt: new Date().toISOString(),
      },
      {
        uId: 'example-admin',
        projectId,
        fileName: 'installation.md',
        filePath: 'docs/setup/installation.md',
        folderPath: 'docs/setup',
        originalText: `# Installation Guide

## Prerequisites

Before installing this security framework, ensure you have:
- Node.js 18+ installed
- Docker and Docker Compose
- Git for version control
- A compatible database (PostgreSQL recommended)

## Quick Start

1. Clone the repository:
\`\`\`bash
git clone https://github.com/owasp/top10.git
cd top10
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Run the application:
\`\`\`bash
npm run dev
\`\`\`

## Docker Installation

For containerized deployment:

\`\`\`bash
docker-compose up -d
\`\`\`

## Configuration

Key configuration options:
- Database connection settings
- Authentication providers
- Security headers
- Logging configuration

## Troubleshooting

Common issues and solutions:
1. Port conflicts - Check if port 3000 is available
2. Database connection errors - Verify credentials
3. Permission issues - Run with appropriate privileges`,
        translatedText: '',
        status: 'pending',
        assignedTranslatorId: 'translator-3',
        translations: [],
        wordCount: 180,
        estimatedHours: 1,
        actualHours: 0,
        createdBy: 'example-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 1800,
        githubSha: 'jkl012mno345',
        lastSyncedAt: new Date().toISOString(),
      }
    ],
    // Cybersecurity Fundamentals files
    [
      {
        uId: 'example-admin',
        projectId,
        fileName: 'introduction.md',
        filePath: 'docs/01-introduction.md',
        folderPath: 'docs',
        originalText: `# Introduction to Cybersecurity

## What is Cybersecurity?

Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes.

## Core Principles

### Confidentiality
Ensuring that information is accessible only to those authorized to have access.

### Integrity
Safeguarding the accuracy and completeness of information and processing methods.

### Availability
Ensuring that authorized users have access to information and associated assets when required.

## Common Threats

1. **Malware** - Malicious software including viruses, worms, and ransomware
2. **Phishing** - Fraudulent attempts to obtain sensitive information
3. **Social Engineering** - Psychological manipulation to trick users
4. **Man-in-the-Middle Attacks** - Intercepting communications
5. **Denial of Service** - Making resources unavailable

## Security Framework

A comprehensive security framework includes:
- Risk assessment and management
- Security policies and procedures
- Technical controls and safeguards
- Incident response planning
- Security awareness training`,
        translatedText: '',
        status: 'not taken',
        translations: [],
        wordCount: 210,
        estimatedHours: 1,
        actualHours: 0,
        createdBy: 'example-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 2100,
        githubSha: 'mno345pqr678',
        lastSyncedAt: new Date().toISOString(),
      }
    ],
    // Network Security files
    [
      {
        uId: 'example-admin',
        projectId,
        fileName: 'network-fundamentals.rst',
        filePath: 'docs/network/fundamentals.rst',
        folderPath: 'docs/network',
        originalText: `Network Security Fundamentals
============================

Network Infrastructure Security
-------------------------------

Network security involves protecting the integrity, confidentiality, and availability of data and resources as they are transmitted across or accessed through networks.

Key Components
~~~~~~~~~~~~~

Firewalls
^^^^^^^^^
Network security devices that monitor and control incoming and outgoing network traffic based on predetermined security rules.

Types of firewalls:
- Packet filtering firewalls
- Stateful inspection firewalls
- Application layer firewalls
- Next-generation firewalls (NGFW)

Intrusion Detection Systems (IDS)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Monitor network traffic for suspicious activity and known threats.

Network Segmentation
^^^^^^^^^^^^^^^^^^^
The practice of splitting a computer network into subnetworks to improve security and performance.

Virtual Private Networks (VPN)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Secure connections over public networks using encryption and tunneling protocols.

Protocol Security
-----------------

SSL/TLS
~~~~~~~
Cryptographic protocols designed to provide communications security over a computer network.

IPSec
~~~~~
Internet Protocol Security suite of protocols for securing Internet Protocol communications.

DNS Security
~~~~~~~~~~~~
Protecting Domain Name System infrastructure from attacks and ensuring reliable name resolution.`,
        translatedText: '',
        status: 'in progress',
        assignedTranslatorId: 'translator-1',
        translations: [],
        wordCount: 185,
        estimatedHours: 1,
        actualHours: 0,
        createdBy: 'example-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 1850,
        githubSha: 'pqr678stu901',
        lastSyncedAt: new Date().toISOString(),
      }
    ]
  ];

  // Cast to the expected FirestoreFile shape so TypeScript is satisfied
  return (baseFiles[projectIndex] || []) as Omit<FirestoreFile, 'id'>[];
};

export async function seedExampleData(userId: string): Promise<{success: boolean, message: string, data?: any}> {
  try {
    const firestore = await getFirestore();
    const batch = firestore.batch();

    console.log('Starting to seed example data...');

    // Create projects first
    const projectIds: string[] = [];
    const createdProjects: any[] = [];

    for (const projectData of exampleProjects) {
      const projectRef = firestore.collection('projects').doc();
      const finalProjectData = {
        ...projectData,
        uId: userId,
        createdBy: userId,
      };
      
      // Remove undefined fields to avoid Firestore errors
      Object.keys(finalProjectData).forEach(key => {
        const value = finalProjectData[key as keyof typeof finalProjectData];
        if (value === undefined) {
          delete finalProjectData[key as keyof typeof finalProjectData];
        }
      });
      
      batch.set(projectRef, finalProjectData);
      projectIds.push(projectRef.id);
      createdProjects.push({ id: projectRef.id, ...finalProjectData });
    }

    // Create files for each project
    const allFiles: any[] = [];
    
    for (let i = 0; i < projectIds.length; i++) {
      const projectId = projectIds[i];
      const files = exampleFiles(i, projectId);
      const fileIds: string[] = [];

      for (const fileData of files) {
        const fileRef = firestore.collection('files').doc();
        const finalFileData = {
          ...fileData,
          uId: userId,
          createdBy: userId,
          projectId: projectId,
        };

        // Remove undefined fields to avoid Firestore errors
        Object.keys(finalFileData).forEach(key => {
          const value = finalFileData[key as keyof typeof finalFileData];
          if (value === undefined) {
            delete finalFileData[key as keyof typeof finalFileData];
          }
        });

        batch.set(fileRef, finalFileData);
        fileIds.push(fileRef.id);
        allFiles.push({ id: fileRef.id, ...finalFileData });
      }

      // Update project with file IDs
      const projectRef = firestore.collection('projects').doc(projectId);
      batch.update(projectRef, { files: fileIds });
      createdProjects[i].files = fileIds;
    }

    // Commit all changes
    await batch.commit();

    console.log('Example data seeded successfully!');
    
    return {
      success: true,
      message: `Successfully created ${createdProjects.length} projects and ${allFiles.length} files`,
      data: {
        projects: createdProjects,
        files: allFiles,
      }
    };

  } catch (error) {
    console.error('Error seeding example data:', error);
    return {
      success: false,
      message: `Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function clearExampleData(userId: string): Promise<{success: boolean, message: string}> {
  try {
    const firestore = await getFirestore();
    
    // Delete all projects created by this user
    const projectsSnapshot = await firestore
      .collection('projects')
      .where('createdBy', '==', userId)
      .get();

    // Delete all files for these projects
    const filesSnapshot = await firestore
      .collection('files')
      .where('createdBy', '==', userId)
      .get();

    const batch = firestore.batch();

    projectsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    filesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return {
      success: true,
      message: `Deleted ${projectsSnapshot.docs.length} projects and ${filesSnapshot.docs.length} files`,
    };

  } catch (error) {
    console.error('Error clearing example data:', error);
    return {
      success: false,
      message: `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
} 