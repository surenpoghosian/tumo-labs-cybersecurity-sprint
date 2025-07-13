import { NextResponse } from 'next/server';
import { getCyberSecProjectById } from '@/data/mockData';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { id } = await params;
  const project = getCyberSecProjectById(id);
  
  if (!project) {
    return NextResponse.json(
      { success: false, error: 'Project not found' },
      { status: 404 }
    );
  }
  
  // Add mock documentation content
  const documentationContent = {
    'project-1': `# OWASP Top 10 2021

## Introduction

The OWASP Top 10 is a standard awareness document for developers and web application security. It represents a broad consensus about the most critical security risks to web applications.

## A01:2021 – Broken Access Control

Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of all data or performing a business function outside the user's limits.

### Common Weaknesses
- Violation of the principle of least privilege
- Bypassing access control checks
- Permitting viewing or editing someone else's account
- Accessing API with missing access controls`,
    'project-2': `# Metasploit Framework Documentation

## Overview

The Metasploit Framework is a Ruby-based, modular penetration testing platform that enables you to write, test, and execute exploit code.

## Getting Started

### Installation
\`\`\`bash
curl https://raw.githubusercontent.com/rapid7/metasploit-framework/master/msfinstall > msfinstall
chmod 755 msfinstall
./msfinstall
\`\`\`

### Basic Usage
\`\`\`bash
msfconsole
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 192.168.1.100
run
\`\`\``,
    'project-3': `# Wireshark User Guide

## Introduction

Wireshark is a network protocol analyzer. It lets you capture and interactively browse the traffic running on a computer network.

## Starting Wireshark

When you start Wireshark, you'll see the start screen with a list of available capture interfaces.

### Capture Interfaces
- Ethernet interfaces
- Wireless interfaces  
- USB interfaces
- Bluetooth interfaces

## Capturing Packets

To start capturing:
1. Select an interface
2. Click Start
3. Monitor live traffic`
  };
  
  const content = documentationContent[id as keyof typeof documentationContent] || 'Documentation content not available';
  
  return NextResponse.json({
    success: true,
    data: {
      ...project,
      documentationContent: content,
      availableDocuments: [
        `${project.docsPath}`,
        '/docs/installation.md',
        '/docs/configuration.md',
        '/docs/examples.md'
      ]
    }
  });
} 