/* eslint-disable @typescript-eslint/no-explicit-any */
// Seed script to populate Firestore with example projects and files for testing
import { getFirestore } from './firebaseAdmin';
import { FirestoreProject, FirestoreFile } from './firestore';

// Helper function to calculate word count from text
function calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

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
    source: 'https://github.com/microsoft/Security-101',
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
    source: 'https://github.com/Nouran-Salah/Computer-Networks-and-Security',
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
      (() => {
        const readmeText = `# OWASP Top 10 Web Application Security Risks

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
- Security consultants`;
        
        return {
          uId: 'example-admin',
          projectId,
          fileName: 'README.md',
          filePath: 'README.md',
          folderPath: 'root',
          originalText: readmeText,
          translatedText: '',
          status: 'not taken',
          translations: [],
          wordCount: calculateWordCount(readmeText),
          estimatedHours: 1,
          actualHours: 0,
          createdBy: 'example-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          storageType: 'firestore',
          fileSize: readmeText.length,
          githubSha: 'abc123def456',
          lastSyncedAt: new Date().toISOString(),
          visibility: 'private' as const,
        };
      })(),
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
        wordCount: calculateWordCount(`# A01:2021 – Injection

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
- [CWE-79: Cross-site Scripting](https://cwe.mitre.org/data/definitions/79.html)`),
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
        visibility: 'private' as const,
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
        translatedText: `# A02:2021 – Կրիպտոգրաֆիական Անձախողություններ

## Ծանոթություն

Նախկինում հայտնի էր որպես Զգայուն Տվյալների Բացահայտում, կրիպտոգրաֆիական անձախողությունները հանգեցնում են զգայուն տվյալների բացահայտման կամ համակարգի խաթարման: Կենտրոնանում է կրիպտոգրաֆիայի հետ կապված անձախողությունների վրա, որոնք հաճախ հանգեցնում են զգայուն տվյալների բացահայտման:

## Նկարագրություն

Առաջին քայլը տվյալների պաշտպանության պահանջների որոշումն է փոխադրման և պահպանման ժամանակ: Օրինակ՝ գաղտնաբառերը, վարկային քարտերի համարները, առողջական գրառումները, անձնական տեղեկությունները և բիզնես գաղտնիքները պահանջում են լրացուցիչ պաշտպանություն:

## Հիմնական Թուլությունները

### Թույլ կամ Հնացած Ալգորիթմներ
- Հնացած կրիպտոգրաֆիական ալգորիթմների օգտագործում
- Անբավարար բանալիների երկարություն
- Թույլ պատահական թվերի գեներացիա

### Վատ Բանալիների Կառավարում
- Կոդում ամրագրված գաղտնագրման բանալիներ
- Թույլ բանալիների ստացում
- Բանալիների անտառանձ պահպանում
- Բանալիների կրկնակի օգտագործում

## Կանխարգելում

1. **Տվյալների Դասակարգում**
   - Որոշել, թե որ տվյալներն են զգայուն
   - Կիրառել վերահսկողություն ըստ դասակարգման

2. **Չպահպանել Անարժեք Զգայուն Տվյալներ**
   - Հեռացնել զգայուն տվյալները հնարավորինս շուտ
   - Օգտագործել տոկենացում կամ կրճատում

3. **Գաղտնագրել Բոլոր Զգայուն Տվյալները**
   - Օգտագործել ամուր գաղտնագրման ալգորիթմներ
   - Ճիշտ բանալիների կառավարում`,
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
        visibility: 'public' as const, // Make this public for testing
        publishedAt: new Date().toISOString(),
        seoTitle: 'Cryptographic Failures - OWASP Top 10 Armenian Translation',
        seoDescription: 'Learn about cryptographic failures and how to prevent them. Armenian translation of OWASP Top 10 A02:2021.',
        seoKeywords: ['armenian cybersecurity', 'cryptographic failures', 'OWASP', 'security']
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
        visibility: 'private' as const,
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
        visibility: 'private' as const,
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
        translatedText: `# Ցանցային Անվտանգության Հիմունքներ

## Ցանցային Ենթակառուցվածքի Անվտանգություն

Ցանցային անվտանգությունը ներառում է տվյալների և ռեսուրսների ամբողջականության, գաղտնիության և մատչելիության պաշտպանությունը, երբ դրանք փոխանցվում են ցանցով կամ օգտագործվում ցանցի միջոցով:

## Հիմնական Բաղադրիչներ

### Firewall-ներ
Ցանցային անվտանգության սարքեր, որոնք վերահսկում և կառավարում են մուտքային և ելքային ցանցային երթևեկությունը՝ հիմնվելով նախապես որոշված անվտանգության կանոնների վրա:

Firewall-ների տեսակները.
- Փաթեթների զտման firewall-ներ
- Վիճակային ստուգման firewall-ներ
- Կիրառական շերտի firewall-ներ
- Նոր սերնդի firewall-ներ (NGFW)

### Ներխուժման Հայտնաբերման Համակարգեր (IDS)
Վերահսկում են ցանցային երթևեկությունը կասկածելի գործունեության և հայտնի սպառնալիքների համար:`,
        status: 'accepted',
        assignedTranslatorId: 'translator-1',
        reviewerId: 'reviewer-1',
        translations: [],
        wordCount: 185,
        estimatedHours: 1,
        actualHours: 1.2,
        createdBy: 'example-admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        storageType: 'firestore',
        fileSize: 1850,
        githubSha: 'pqr678stu901',
        lastSyncedAt: new Date().toISOString(),
        visibility: 'public' as const, // Make this public for testing
        publishedAt: new Date().toISOString(),
        seoTitle: 'Network Security Fundamentals - Armenian Translation',
        seoDescription: 'Network security fundamentals translated into Armenian covering firewalls, IDS, and security protocols.',
        seoKeywords: ['armenian cybersecurity', 'network security', 'firewall', 'ցանցային անվտանգություն']
      },
      // Additional comprehensive files for OWASP Top 10 project
      (() => {
        const webAppSecText = `# Web Application Security Testing Guide

## Introduction

Web application security testing is a crucial process that helps identify vulnerabilities and security weaknesses in web applications before they are deployed to production environments. This comprehensive guide covers methodologies, tools, and best practices for conducting thorough security assessments.

## Testing Methodology

### 1. Information Gathering

Before conducting any security tests, it's essential to gather comprehensive information about the target application:

- **Application Architecture**: Understanding the underlying technology stack, frameworks, and infrastructure
- **Business Logic**: Analyzing how the application processes data and handles user interactions
- **Entry Points**: Identifying all possible ways users can interact with the application
- **Data Flow**: Mapping how data moves through the application from input to storage

### 2. Configuration and Deployment Management Testing

Proper configuration is fundamental to application security:

- **Server Configuration**: Reviewing web server settings, error handling, and administrative interfaces
- **Application Platform Configuration**: Examining framework-specific settings and security configurations
- **File Extensions Handling**: Testing how different file types are processed and served
- **Backup Files**: Checking for exposed backup files, configuration files, and temporary files

### 3. Identity Management Testing

Authentication and session management are critical security components:

- **Authentication Testing**: Verifying the strength of authentication mechanisms
- **Session Management**: Testing session creation, maintenance, and termination
- **Password Policies**: Evaluating password complexity requirements and account lockout mechanisms
- **Multi-Factor Authentication**: Testing implementation of additional authentication factors

### 4. Authorization Testing

Ensuring proper access controls are in place:

- **Directory Traversal**: Testing for unauthorized file system access
- **Authorization Schema Bypass**: Attempting to access restricted resources
- **Privilege Escalation**: Testing for horizontal and vertical privilege escalation vulnerabilities
- **Insecure Direct Object References**: Verifying proper authorization for object access

### 5. Session Management Testing

Sessions are critical for maintaining user state:

- **Session Token Generation**: Analyzing randomness and unpredictability of session tokens
- **Session Token Handling**: Testing secure transmission and storage of session data
- **Session Termination**: Verifying proper session cleanup and logout functionality
- **Session Fixation**: Testing resistance to session fixation attacks

### 6. Input Validation Testing

Input validation is the first line of defense against many attacks:

- **Cross-Site Scripting (XSS)**: Testing for reflected, stored, and DOM-based XSS vulnerabilities
- **SQL Injection**: Comprehensive testing for SQL injection in all input parameters
- **LDAP Injection**: Testing LDAP query injection vulnerabilities
- **Command Injection**: Testing for OS command injection vulnerabilities
- **Buffer Overflow**: Testing for buffer overflow conditions in input handling

### 7. Error Handling

Proper error handling prevents information disclosure:

- **Error Messages**: Analyzing error messages for sensitive information disclosure
- **Stack Traces**: Checking if detailed stack traces are exposed to users
- **Application Errors**: Testing application behavior under error conditions
- **Custom Error Pages**: Verifying implementation of custom error handling

### 8. Cryptography

Strong cryptography protects sensitive data:

- **Data Transmission**: Testing encryption of data in transit
- **Data Storage**: Verifying encryption of sensitive data at rest
- **Key Management**: Analyzing cryptographic key generation and management
- **Algorithm Strength**: Evaluating the strength of cryptographic algorithms used

### 9. Business Logic Testing

Testing application-specific logic:

- **Business Rules**: Verifying enforcement of business rules and constraints
- **Data Validation**: Testing business logic data validation
- **Workflow**: Analyzing multi-step processes for logical flaws
- **Race Conditions**: Testing for race condition vulnerabilities

### 10. Client-Side Testing

Security testing extends to client-side components:

- **JavaScript Security**: Analyzing client-side JavaScript for security vulnerabilities
- **Browser Storage**: Testing security of local storage, session storage, and cookies
- **HTML5 Security**: Evaluating HTML5-specific security features and vulnerabilities
- **Client-Side Validation**: Testing bypass of client-side validation mechanisms

## Testing Tools and Techniques

### Automated Testing Tools

Automated tools can help identify common vulnerabilities quickly:

- **SAST (Static Application Security Testing)**: Tools that analyze source code for vulnerabilities
- **DAST (Dynamic Application Security Testing)**: Tools that test running applications
- **IAST (Interactive Application Security Testing)**: Tools that combine static and dynamic analysis
- **Dependency Scanners**: Tools that identify vulnerable third-party components

### Manual Testing Techniques

Manual testing is essential for identifying complex vulnerabilities:

- **Code Review**: Manual analysis of source code for security vulnerabilities
- **Penetration Testing**: Simulated attacks to identify exploitable vulnerabilities
- **Threat Modeling**: Systematic analysis of potential threats and attack vectors
- **Security Architecture Review**: Analysis of application design and architecture

## Best Practices

### Testing Environment

- **Isolated Environment**: Conduct testing in isolated environments that mirror production
- **Data Protection**: Use anonymized or synthetic test data to protect sensitive information
- **Documentation**: Maintain detailed documentation of testing procedures and findings
- **Collaboration**: Foster collaboration between security teams and development teams

### Continuous Security Testing

- **Integration**: Integrate security testing into the software development lifecycle
- **Automation**: Automate repetitive security tests where possible
- **Regular Assessment**: Conduct regular security assessments throughout development
- **Training**: Provide security training for development and testing teams

### Reporting and Remediation

- **Clear Reporting**: Provide clear, actionable security findings and recommendations
- **Risk Assessment**: Assess and communicate the business risk of identified vulnerabilities
- **Remediation Guidance**: Provide specific guidance for fixing identified vulnerabilities
- **Verification**: Verify that security fixes address the identified vulnerabilities

## Conclusion

Web application security testing is an ongoing process that requires a systematic approach, appropriate tools, and skilled personnel. By following this comprehensive guide and implementing robust testing procedures, organizations can significantly improve the security posture of their web applications and protect against evolving cyber threats.

Regular security testing, combined with secure development practices and continuous monitoring, forms the foundation of a strong application security program. As threats continue to evolve, security testing methodologies must also adapt to address new attack vectors and vulnerabilities.`;

        return {
          uId: 'example-admin',
          projectId,
          fileName: 'web-app-security-testing.md',
          filePath: 'docs/guides/web-app-security-testing.md',
          folderPath: 'docs/guides',
          originalText: webAppSecText,
          translatedText: '',
          status: 'not taken',
          translations: [],
          wordCount: calculateWordCount(webAppSecText),
          estimatedHours: Math.max(0.5, Math.ceil(calculateWordCount(webAppSecText) / 250)),
          actualHours: 0,
          createdBy: 'example-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          storageType: 'firestore',
          fileSize: webAppSecText.length,
          githubSha: 'webapp123sec456',
          lastSyncedAt: new Date().toISOString(),
          visibility: 'private' as const,
        };
      })(),
      (() => {
        const secureCodeText = `# Secure Coding Practices Guide

## Introduction

Secure coding is the practice of developing computer software in a way that guards against the accidental introduction of security vulnerabilities. This comprehensive guide provides developers with practical techniques and methodologies to write secure code across various programming languages and platforms.

## Core Security Principles

### 1. Defense in Depth

Defense in depth is a layered security approach where multiple security controls are implemented throughout an application:

- **Multiple Layers**: Implement security controls at the network, host, application, and data layers
- **Redundancy**: Ensure that if one security control fails, others are in place to provide protection
- **Diversity**: Use different types of security controls to protect against various attack vectors
- **Fail-Safe Defaults**: Design systems to fail securely by default

### 2. Principle of Least Privilege

Grant users and processes only the minimum privileges necessary to perform their functions:

- **User Permissions**: Assign minimal necessary permissions to user accounts
- **Process Privileges**: Run processes with the lowest possible privileges
- **Database Access**: Limit database user permissions to specific tables and operations
- **File System Access**: Restrict file system access to necessary directories only

### 3. Input Validation and Sanitization

All input should be considered untrusted and properly validated:

- **Whitelist Validation**: Use positive validation (whitelist) rather than negative validation (blacklist)
- **Data Type Validation**: Ensure input matches expected data types and formats
- **Length Validation**: Verify that input length is within acceptable bounds
- **Encoding**: Properly encode data for the context in which it will be used

### 4. Output Encoding

Properly encode all output to prevent injection attacks:

- **Context-Specific Encoding**: Use appropriate encoding for HTML, JavaScript, CSS, and URL contexts
- **Character Set Consistency**: Maintain consistent character encoding throughout the application
- **Template Security**: Use secure templating engines that provide automatic output encoding
- **Content Security Policy**: Implement CSP headers to prevent XSS attacks

## Language-Specific Security Practices

### Java Security

Java applications require specific security considerations:

**Memory Management:**
- Use built-in string and collection classes to avoid buffer overflows
- Be aware of string immutability and potential memory leaks with large string operations
- Properly manage object lifecycle and garbage collection

**Authentication and Authorization:**
- Use established frameworks like Spring Security for authentication
- Implement proper session management with secure session cookies
- Use JAAS (Java Authentication and Authorization Service) for enterprise applications

**Database Security:**
- Always use PreparedStatement for database queries to prevent SQL injection
- Implement proper connection pooling and connection lifecycle management
- Use database-specific security features like stored procedures with proper parameter binding

**Cryptography:**
- Use Java Cryptography Extension (JCE) for cryptographic operations
- Implement proper key management and secure random number generation
- Use established algorithms like AES for symmetric encryption and RSA for asymmetric encryption

### JavaScript Security

JavaScript security spans both client-side and server-side considerations:

**Client-Side Security:**
- Implement Content Security Policy (CSP) to prevent XSS attacks
- Use HTTPS for all communication to prevent man-in-the-middle attacks
- Validate and sanitize all user input before processing
- Avoid eval() and other dynamic code execution functions

**Node.js Security:**
- Keep Node.js and npm packages updated to latest secure versions
- Use helmet.js middleware to set secure HTTP headers
- Implement proper error handling to prevent information disclosure
- Use environment variables for sensitive configuration data

**Authentication:**
- Implement proper session management with secure cookies
- Use established authentication libraries like Passport.js
- Implement proper password hashing using bcrypt or similar algorithms
- Consider implementing multi-factor authentication for sensitive applications

### Python Security

Python applications have specific security considerations:

**Input Validation:**
- Use parameterized queries with libraries like SQLAlchemy to prevent SQL injection
- Validate and sanitize all user input using libraries like Cerberus or marshmallow
- Be cautious with pickle and eval() functions that can execute arbitrary code

**Web Framework Security:**
- Use Django's built-in security features including CSRF protection
- Implement proper template security to prevent XSS attacks
- Use Flask-Security or similar extensions for comprehensive security features
- Configure secure session cookies and headers

**Cryptography:**
- Use the cryptography library for cryptographic operations
- Implement proper key derivation using PBKDF2, scrypt, or Argon2
- Use secrets module for generating cryptographically strong random numbers

## Common Vulnerability Prevention

### SQL Injection Prevention

SQL injection is one of the most common web application vulnerabilities:

**Parameterized Queries:**
\`\`\`sql
-- Vulnerable code
String query = "SELECT * FROM users WHERE id = " + userId;

-- Secure code
PreparedStatement stmt = connection.prepareStatement("SELECT * FROM users WHERE id = ?");
stmt.setInt(1, userId);
\`\`\`

**Stored Procedures:**
- Use stored procedures with parameter binding when appropriate
- Ensure stored procedures themselves don't contain dynamic SQL vulnerabilities
- Validate input parameters within stored procedures

**Input Validation:**
- Validate all input for data type, length, format, and range
- Use whitelist validation rather than blacklist validation
- Implement server-side validation even if client-side validation exists

### Cross-Site Scripting (XSS) Prevention

XSS attacks inject malicious scripts into web pages:

**Output Encoding:**
- HTML encode all user-generated content displayed in HTML context
- JavaScript encode data inserted into JavaScript context
- URL encode data used in URL parameters
- CSS encode data used in CSS context

**Content Security Policy:**
- Implement strict CSP headers to prevent inline script execution
- Use nonce or hash-based CSP for legitimate inline scripts
- Regularly review and update CSP policies

**Input Validation:**
- Validate and sanitize all user input
- Use established libraries for HTML sanitization
- Consider implementing a Web Application Firewall (WAF)

### Cross-Site Request Forgery (CSRF) Prevention

CSRF attacks trick users into performing unintended actions:

**CSRF Tokens:**
- Generate unique, unpredictable tokens for each user session
- Include CSRF tokens in all state-changing forms and AJAX requests
- Validate CSRF tokens on the server side for all state-changing operations

**SameSite Cookies:**
- Use SameSite cookie attribute to prevent cross-site request inclusion
- Consider using Strict or Lax SameSite policies based on application requirements
- Combine with other CSRF protection mechanisms for defense in depth

**Custom Headers:**
- Require custom headers for AJAX requests that change application state
- Verify presence and value of custom headers on the server side
- Use this technique in combination with CSRF tokens

## Security Testing and Code Review

### Static Code Analysis

Static analysis tools can identify security vulnerabilities in source code:

**Tool Selection:**
- Choose tools appropriate for your programming language and framework
- Configure tools to focus on security-relevant rules and patterns
- Integrate static analysis into the development pipeline

**Custom Rules:**
- Develop custom rules for application-specific security requirements
- Focus on business logic vulnerabilities that generic tools might miss
- Regularly update and refine custom rules based on new threats

### Dynamic Testing

Dynamic testing involves testing the running application:

**Automated Scanners:**
- Use DAST tools to identify runtime vulnerabilities
- Configure scanners for authenticated testing of protected areas
- Combine with manual testing for comprehensive coverage

**Penetration Testing:**
- Conduct regular penetration testing by qualified security professionals
- Focus on business logic vulnerabilities and complex attack scenarios
- Document findings and track remediation efforts

### Code Review Process

Manual code review is essential for identifying complex security issues:

**Review Criteria:**
- Focus on security-critical code paths and functions
- Review authentication, authorization, and session management code
- Examine input validation and output encoding implementations
- Check cryptographic implementations and key management

**Review Tools:**
- Use collaborative code review tools to facilitate team participation
- Maintain checklists of common security issues to review
- Document security findings and track remediation

## Conclusion

Secure coding is an essential skill for all software developers in today's threat landscape. By following these practices and principles, developers can significantly reduce the security vulnerabilities in their applications. Remember that security is not a one-time effort but an ongoing process that requires continuous learning, testing, and improvement.

Regular security training, code reviews, and testing should be integrated into the software development lifecycle. As new threats emerge and technologies evolve, secure coding practices must also adapt to address new challenges and vulnerabilities.`;

        return {
          uId: 'example-admin',
          projectId,
          fileName: 'secure-coding-practices.md',
          filePath: 'docs/guides/secure-coding-practices.md',
          folderPath: 'docs/guides',
          originalText: secureCodeText,
          translatedText: '',
          status: 'not taken',
          translations: [],
          wordCount: calculateWordCount(secureCodeText),
          estimatedHours: Math.max(0.5, Math.ceil(calculateWordCount(secureCodeText) / 250)),
          actualHours: 0,
          createdBy: 'example-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          storageType: 'firestore',
          fileSize: secureCodeText.length,
          githubSha: 'secure789code012',
          lastSyncedAt: new Date().toISOString(),
          visibility: 'private' as const,
        };
      })(),
      (() => {
        const incidentResponseText = `# Cybersecurity Incident Response Plan

## Executive Summary

A cybersecurity incident response plan is a documented set of procedures designed to help organizations prepare for, detect, respond to, and recover from cybersecurity incidents. This comprehensive plan outlines the roles, responsibilities, and procedures necessary to effectively manage cybersecurity incidents and minimize their impact on business operations.

## Incident Response Team Structure

### Core Team Members

**Incident Response Manager:**
- Overall responsibility for incident response coordination
- Communication with executive leadership and external stakeholders
- Decision-making authority for incident response strategies
- Resource allocation and team coordination

**Security Analyst:**
- Initial incident detection and analysis
- Evidence collection and preservation
- Technical investigation and forensic analysis
- Vulnerability assessment and remediation recommendations

**IT Operations Specialist:**
- System isolation and containment procedures
- Infrastructure monitoring and maintenance during incidents
- System restoration and recovery operations
- Network traffic analysis and monitoring

**Legal Counsel:**
- Regulatory compliance and legal requirements
- Communication with law enforcement agencies
- Contract review and vendor management
- Privacy and data protection considerations

**Communications Specialist:**
- Internal and external communication coordination
- Media relations and public communication
- Customer notification and stakeholder updates
- Documentation and reporting requirements

### Extended Team Members

**Human Resources Representative:**
- Employee notification and communication
- Personnel security and background checks
- Training and awareness program management
- Disciplinary actions and termination procedures

**Business Continuity Manager:**
- Business impact assessment and analysis
- Continuity planning and implementation
- Recovery time and point objectives
- Alternative business process development

**External Consultants:**
- Specialized forensic analysis and investigation
- Legal and regulatory expertise
- Technical remediation and system hardening
- Independent security assessment and validation

## Incident Classification and Prioritization

### Severity Levels

**Critical (Severity 1):**
- Complete system compromise or data breach
- Significant business operations disruption
- Public safety or national security implications
- Immediate executive leadership notification required
- Response time: Within 1 hour

**High (Severity 2):**
- Partial system compromise or unauthorized access
- Limited business operations impact
- Potential data loss or corruption
- Senior management notification required
- Response time: Within 4 hours

**Medium (Severity 3):**
- Suspicious activity or potential security violation
- Minimal business operations impact
- No confirmed data loss or system compromise
- Department management notification required
- Response time: Within 24 hours

**Low (Severity 4):**
- Security policy violations or minor incidents
- No business operations impact
- Educational or awareness opportunities
- Team lead notification required
- Response time: Within 72 hours

### Incident Types

**Malware Infections:**
- Virus, worm, trojan, or ransomware detection
- System performance degradation or unusual behavior
- Unauthorized software installation or execution
- Network propagation or lateral movement

**Data Breaches:**
- Unauthorized access to sensitive information
- Data theft or exfiltration attempts
- Privacy regulation violations
- Customer or employee data exposure

**Network Intrusions:**
- Unauthorized network access or penetration
- Suspicious network traffic patterns
- Firewall or intrusion detection system alerts
- Command and control communication detection

**Insider Threats:**
- Malicious or negligent employee actions
- Unauthorized data access or modification
- Policy violations or procedural breaches
- Privilege abuse or escalation attempts

**Physical Security Incidents:**
- Unauthorized facility access or entry
- Theft of equipment or information
- Social engineering attempts
- Tailgating or piggybacking incidents

## Incident Response Phases

### 1. Preparation

Preparation is the foundation of effective incident response:

**Policy and Procedures:**
- Develop comprehensive incident response policies
- Create detailed response procedures and playbooks
- Establish clear roles and responsibilities
- Define escalation and notification procedures

**Team Training:**
- Regular incident response training and exercises
- Tabletop exercises and simulated incidents
- Technical skills development and certification
- Cross-training for redundancy and coverage

**Tools and Resources:**
- Incident response toolkits and software
- Forensic analysis and evidence collection tools
- Communication and coordination platforms
- Documentation templates and reporting systems

**Infrastructure Hardening:**
- Security controls implementation and monitoring
- Vulnerability management and patch deployment
- Network segmentation and access controls
- Backup and recovery system testing

### 2. Detection and Analysis

Early detection and accurate analysis are critical for effective response:

**Detection Methods:**
- Security information and event management (SIEM) systems
- Intrusion detection and prevention systems (IDS/IPS)
- Endpoint detection and response (EDR) solutions
- User and entity behavior analytics (UEBA)

**Initial Analysis:**
- Incident verification and validation
- Impact assessment and scope determination
- Evidence identification and preservation
- Timeline establishment and documentation

**Classification and Prioritization:**
- Severity level assignment based on impact
- Incident type categorization for response procedures
- Resource allocation and team assignment
- Communication and notification requirements

**Detailed Investigation:**
- Forensic analysis and evidence collection
- Root cause analysis and attack vector identification
- Lateral movement and compromise assessment
- Attribution and threat actor profiling

### 3. Containment, Eradication, and Recovery

Swift containment prevents further damage and begins the recovery process:

**Short-term Containment:**
- Immediate threat isolation and quarantine
- Network segmentation and access restriction
- System shutdown or disconnection if necessary
- Evidence preservation and documentation

**Long-term Containment:**
- Comprehensive system hardening and patching
- Security control enhancement and monitoring
- Temporary workarounds and alternative processes
- Ongoing threat monitoring and detection

**Eradication:**
- Complete threat removal and system cleaning
- Vulnerability remediation and security patching
- Security control implementation and testing
- System hardening and configuration management

**Recovery:**
- System restoration from clean backups
- Service restoration and functionality testing
- User access restoration and validation
- Enhanced monitoring and threat detection

### 4. Post-Incident Activities

Learning from incidents improves future response capabilities:

**Lessons Learned:**
- Post-incident review and analysis
- Process improvement identification
- Training and awareness updates
- Policy and procedure revisions

**Documentation:**
- Comprehensive incident documentation
- Timeline and decision-making rationale
- Evidence preservation and chain of custody
- Regulatory reporting and compliance

**Communication:**
- Stakeholder notification and updates
- Customer communication and support
- Regulatory reporting and compliance
- Media relations and public communication

**Recovery Validation:**
- System security and functionality testing
- Performance monitoring and optimization
- User training and support
- Business process validation

## Communication and Reporting

### Internal Communication

**Executive Leadership:**
- Regular status updates and briefings
- Strategic decision-making support
- Resource allocation and prioritization
- Business impact assessment and communication

**IT and Security Teams:**
- Technical coordination and collaboration
- Status updates and progress reports
- Resource requests and task assignments
- Knowledge sharing and best practices

**Business Units:**
- Operational impact assessment and communication
- Alternative process development and implementation
- User training and support requirements
- Recovery timeline and expectations

### External Communication

**Customers and Partners:**
- Incident notification and impact assessment
- Service availability and recovery updates
- Data protection and privacy assurances
- Support and assistance availability

**Regulatory Authorities:**
- Mandatory incident reporting and disclosure
- Investigation cooperation and support
- Compliance demonstration and documentation
- Remediation plan development and implementation

**Law Enforcement:**
- Criminal activity reporting and investigation
- Evidence preservation and cooperation
- Witness statements and testimony
- Legal process support and compliance

**Media and Public:**
- Public communication and transparency
- Brand reputation protection and management
- Stakeholder confidence and trust maintenance
- Crisis communication and messaging

## Legal and Regulatory Considerations

### Data Protection Laws

**General Data Protection Regulation (GDPR):**
- 72-hour breach notification requirement
- Individual notification obligations
- Data protection impact assessments
- Regulatory fines and penalties

**California Consumer Privacy Act (CCPA):**
- Consumer notification requirements
- Privacy rights and protections
- Business obligations and responsibilities
- Enforcement and penalty provisions

**Health Insurance Portability and Accountability Act (HIPAA):**
- Protected health information safeguards
- Breach notification requirements
- Business associate obligations
- Enforcement and penalty provisions

### Industry Regulations

**Financial Services:**
- Payment Card Industry Data Security Standard (PCI DSS)
- Gramm-Leach-Bliley Act (GLBA) requirements
- Federal Financial Institutions Examination Council (FFIEC) guidance
- State and federal banking regulations

**Healthcare:**
- HIPAA Security Rule requirements
- Health Information Technology for Economic and Clinical Health (HITECH) Act
- Food and Drug Administration (FDA) cybersecurity guidance
- Joint Commission security standards

**Critical Infrastructure:**
- North American Electric Reliability Corporation (NERC) standards
- Transportation Security Administration (TSA) requirements
- Department of Homeland Security (DHS) guidance
- National Institute of Standards and Technology (NIST) frameworks

## Continuous Improvement

### Metrics and Measurement

**Response Time Metrics:**
- Time to detection and identification
- Time to containment and isolation
- Time to eradication and removal
- Time to recovery and restoration

**Effectiveness Metrics:**
- Incident resolution accuracy and completeness
- False positive and negative rates
- Customer satisfaction and feedback
- Business impact and cost analysis

**Process Improvement:**
- Regular plan review and updates
- Training effectiveness assessment
- Tool and technology evaluation
- Best practice identification and implementation

### Training and Awareness

**Regular Training Programs:**
- Annual incident response training for all team members
- Specialized technical training for security analysts
- Leadership training for incident managers
- Cross-functional collaboration training

**Simulation Exercises:**
- Quarterly tabletop exercises
- Annual full-scale incident simulations
- Red team and penetration testing
- Business continuity and disaster recovery testing

**Awareness Programs:**
- Organization-wide security awareness training
- Incident reporting and escalation procedures
- Social engineering and phishing awareness
- Physical security and access control training

## Conclusion

An effective cybersecurity incident response plan is essential for organizations to protect their assets, reputation, and stakeholders from cyber threats. This comprehensive plan provides the framework for preparing, detecting, responding to, and recovering from cybersecurity incidents while ensuring legal and regulatory compliance.

Regular testing, training, and continuous improvement ensure that the incident response capabilities evolve with the changing threat landscape and organizational needs. By implementing and maintaining a robust incident response program, organizations can minimize the impact of cybersecurity incidents and maintain business continuity in the face of evolving cyber threats.`;

        return {
          uId: 'example-admin',
          projectId,
          fileName: 'incident-response-plan.md',
          filePath: 'docs/guides/incident-response-plan.md',
          folderPath: 'docs/guides',
          originalText: incidentResponseText,
          translatedText: '',
          status: 'not taken',
          translations: [],
          wordCount: calculateWordCount(incidentResponseText),
          estimatedHours: Math.max(0.5, Math.ceil(calculateWordCount(incidentResponseText) / 250)),
          actualHours: 0,
          createdBy: 'example-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          storageType: 'firestore',
          fileSize: incidentResponseText.length,
          githubSha: 'incident456response789',
          lastSyncedAt: new Date().toISOString(),
          visibility: 'private' as const,
        };
      })()
    ]
  ];

  // Generate additional placeholder files for experimentation
  const additionalFiles: Omit<FirestoreFile, 'id'>[] = [];
  for (let i = 1; i <= 20; i++) {
    const originalText = `# Placeholder Content ${i}\n\nThis is generated file ${i} for seeding and experimentation.`;
    const calculatedWordCount = originalText.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    additionalFiles.push({
      uId: 'example-admin',
      projectId,
      fileName: `generated-${i}.md`,
      filePath: `docs/generated/generated-${i}.md`,
      folderPath: 'docs/generated',
      originalText: originalText,
      translatedText: '',
      status: 'not taken',
      translations: [],
      wordCount: calculatedWordCount,
      estimatedHours: Math.max(0.5, Math.ceil(calculatedWordCount / 250)),
      actualHours: 0,
      createdBy: 'example-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      storageType: 'firestore',
      fileSize: originalText.length,
      githubSha: '',
      lastSyncedAt: new Date().toISOString(),
      visibility: 'private' as const, // Default to private until approved
    });
  }

  // Merge base files with the generated placeholders
  return ([...(baseFiles[projectIndex] || []), ...additionalFiles]) as Omit<FirestoreFile, 'id'>[];
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
    
    for (let i = 0; i < projectIds?.length; i++) {
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
      message: `Successfully created ${createdProjects?.length} projects and ${allFiles?.length} files`,
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
      message: `Deleted ${projectsSnapshot.docs?.length} projects and ${filesSnapshot.docs?.length} files`,
    };

  } catch (error) {
    console.error('Error clearing example data:', error);
    return {
      success: false,
      message: `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
} 