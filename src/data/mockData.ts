// Mock data for the Armenian CyberSec Docs platform

export interface User {
  id: string;
  email: string;
  name: string;
  githubUsername: string;
  expertiseAreas: string[];
  isModerator: boolean;
  contributionCount: number;
  certificatesEarned: number;
}

export interface CyberSecProject {
  id: string;
  name: string;
  owner: string;
  description: string;
  category: 'network-security' | 'pen-testing' | 'forensics' | 'malware-analysis' | 'web-security';
  docsPath: string;
  githubUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  translationProgress: number;
  availableForTranslation: boolean;
}

export interface TranslationSegment {
  id: string;
  translationProjectId: string;
  segmentIndex: number;
  originalText: string;
  translatedText: string;
  status: 'pending' | 'in-progress' | 'completed' | 'reviewed';
  translatorNotes: string;
  reviewComments: ReviewComment[];
  lastModified: string;
  estimatedWords: number;
  actualWords: number;
}

export interface TranslationProject {
  id: string;
  cyberSecProjectId: string;
  documentPath: string;
  originalContent: string;
  translatedContent: string;
  status: 'available' | 'in-progress' | 'under-review' | 'pr-submitted' | 'merged';
  assignedTranslatorId: string;
  reviewerId?: string;
  prUrl?: string;
  createdAt: string;
  completedAt?: string;
  totalSegments: number;
  completedSegments: number;
  qualityScore?: number;
  estimatedHours: number;
  actualHours: number;
}

export interface TranslationMemoryEntry {
  id: string;
  originalText: string;
  translatedText: string;
  context: string;
  category: string;
  confidence: number;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export interface ReviewComment {
  id: string;
  reviewerId: string;
  segmentId: string;
  commentText: string;
  type: 'suggestion' | 'correction' | 'question' | 'approval';
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}

export interface Certificate {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  githubRepo: string;
  prUrl: string;
  mergedAt: string;
  certificateType: 'translation' | 'review' | 'contribution';
  category: string;
  verificationCode: string;
  pdfUrl: string;
}

export interface ReviewTask {
  id: string;
  translationProjectId: string;
  reviewerId: string;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected';
  securityAccuracyScore: number;
  languageQualityScore: number;
  comments: string;
  createdAt: string;
  detailedFeedback: ReviewComment[];
}

export interface TranslationSession {
  id: string;
  translationProjectId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  segmentsWorked: number;
  wordsTranslated: number;
  autoSaves: number;
}

// Global storage to persist across Next.js hot reloads
declare global {
  var __mockTranslationProjects: Map<string, TranslationProject> | undefined;
  var __mockTranslationSegments: Map<string, TranslationSegment> | undefined;
}

// Initialize global storage
if (!globalThis.__mockTranslationProjects) {
  globalThis.__mockTranslationProjects = new Map();
}
if (!globalThis.__mockTranslationSegments) {
  globalThis.__mockTranslationSegments = new Map();
}

const translationProjectsStorage = globalThis.__mockTranslationProjects;
const translationSegmentsStorage = globalThis.__mockTranslationSegments;

// Storage management class
class MockDataStorage {
  private static initialized = false;

  public static initializeData() {
    if (MockDataStorage.initialized) return;
    
    // Add initial translation projects
    const initialProjects: TranslationProject[] = [
      {
        id: 'translation-1',
        cyberSecProjectId: 'project-1',
        documentPath: '/docs/01-injection.md',
        originalContent: `# Injection Flaws

Injection flaws, such as SQL, NoSQL, OS, and LDAP injection, occur when untrusted data is sent to an interpreter as part of a command or query. The attacker's hostile data can trick the interpreter into executing unintended commands or accessing data without proper authorization.

## Prevention

- Use parameterized queries or prepared statements
- Validate all input data
- Use white list input validation
- Escape all user supplied input`,
        translatedContent: `# Ներարկման թերությունները

Ներարկման թերությունները, ինչպիսիք են SQL, NoSQL, OS և LDAP ներարկումները, տեղի են ունենում, երբ անվստահ տվյալները ուղարկվում են մեկնաբան՝ որպես հրամանի կամ հարցման մաս: Հարձակվողի թշնամական տվյալները կարող են խաբել մեկնաբանին՝ կատարելու ցանկալի չհրամաններ կամ տվյալներ մուտք գործելու առանց համապատասխան լիազորման:

## Կանխարգելում

- Օգտագործել պարամետրավորված հարցումներ կամ նախապատրաստված հայտարարություններ
- Վավերացնել բոլոր մուտքային տվյալները
- Օգտագործել սպիտակ ցանկի մուտքային վավերացում
- Խուսափել բոլոր օգտատիրոջ տրամադրված մուտքից`,
        status: 'under-review',
        assignedTranslatorId: 'user-1',
        reviewerId: 'user-2',
        createdAt: '2024-01-15T10:30:00Z',
        totalSegments: 6,
        completedSegments: 5,
        qualityScore: 8.5,
        estimatedHours: 4,
        actualHours: 3.5
      },
      {
        id: 'translation-2',
        cyberSecProjectId: 'project-3',
        documentPath: '/doc/capturing-packets.md',
        originalContent: `# Capturing Packets

Wireshark can capture traffic from many different network media types, including Ethernet, Wireless LAN, Bluetooth, USB, and many others. The specific media types supported may be limited by the operating system on which you are running Wireshark.

## Starting a Capture

To start capturing packets:
1. Select the interface you want to capture from
2. Click the "Start" button
3. Packets will begin appearing in the packet list`,
        translatedContent: `# Փաթեթների բռնում

Wireshark-ը կարող է բռնել տրաֆիկ տարբեր ցանցային մեդիա տեսակներից, ներառյալ Ethernet, Անլար LAN, Bluetooth, USB և շատ այլ: Որոշակի մեդիա տեսակների աջակցությունը կարող է սահմանափակվել օպերացիոն համակարգով, որի վրա Wireshark-ը գործարկվում է:

## Բռնման սկսում

Փաթեթների բռնումը սկսելու համար.
1. Ընտրեք միջերեսը, որից ցանկանում եք բռնել
2. Սեղմեք "Սկսել" կոճակը
3. Փաթեթները կսկսեն հայտնվել փաթեթների ցանկում`,
        status: 'pr-submitted',
        assignedTranslatorId: 'user-3',
        reviewerId: 'user-2',
        prUrl: 'https://github.com/wireshark/wireshark/pull/1234',
        createdAt: '2024-01-10T14:20:00Z',
        totalSegments: 4,
        completedSegments: 4,
        qualityScore: 9.2,
        estimatedHours: 3,
        actualHours: 2.8
      }
    ];

    initialProjects.forEach(project => {
      translationProjectsStorage.set(project.id, project);
    });

    // Add initial translation segments
    const initialSegments: TranslationSegment[] = [
      {
        id: 'segment-1',
        translationProjectId: 'translation-1',
        segmentIndex: 0,
        originalText: '# Injection Flaws',
        translatedText: '# Ներարկման թերությունները',
        status: 'completed',
        translatorNotes: 'Standard heading translation',
        reviewComments: [],
        lastModified: '2024-01-15T11:00:00Z',
        estimatedWords: 2,
        actualWords: 2
      },
      {
        id: 'segment-2',
        translationProjectId: 'translation-1',
        segmentIndex: 1,
        originalText: 'Injection flaws, such as SQL, NoSQL, OS, and LDAP injection, occur when untrusted data is sent to an interpreter as part of a command or query.',
        translatedText: 'Ներարկման թերությունները, ինչպիսիք են SQL, NoSQL, OS և LDAP ներարկումները, տեղի են ունենում, երբ անվստահ տվյալները ուղարկվում են մեկնաբան՝ որպես հրամանի կամ հարցման մաս:',
        status: 'reviewed',
        translatorNotes: 'Kept technical terms in English as commonly used',
        reviewComments: [
          {
            id: 'comment-1',
            reviewerId: 'user-2',
            segmentId: 'segment-2',
            commentText: 'Good decision to keep SQL, NoSQL terms in English. Consider adding Armenian explanation in parentheses for first occurrence.',
            type: 'suggestion',
            severity: 'low',
            createdAt: '2024-01-16T09:30:00Z',
            resolved: false
          }
        ],
        lastModified: '2024-01-15T12:30:00Z',
        estimatedWords: 25,
        actualWords: 28
      },
      {
        id: 'segment-3',
        translationProjectId: 'translation-1',
        segmentIndex: 2,
        originalText: 'The attacker\'s hostile data can trick the interpreter into executing unintended commands or accessing data without proper authorization.',
        translatedText: 'Հարձակվողի թշնամական տվյալները կարող են խաբել մեկնաբանին՝ կատարելու ցանկալի չհրամաններ կամ տվյալներ մուտք գործելու առանց համապատասխան լիազորման:',
        status: 'completed',
        translatorNotes: 'Changed "unintended" to "ցանկալի չ" for better flow',
        reviewComments: [],
        lastModified: '2024-01-15T13:15:00Z',
        estimatedWords: 20,
        actualWords: 22
      },
      {
        id: 'segment-4',
        translationProjectId: 'translation-1',
        segmentIndex: 3,
        originalText: '## Prevention',
        translatedText: '## Կանխարգելում',
        status: 'completed',
        translatorNotes: '',
        reviewComments: [],
        lastModified: '2024-01-15T13:20:00Z',
        estimatedWords: 1,
        actualWords: 1
      },
      {
        id: 'segment-5',
        translationProjectId: 'translation-1',
        segmentIndex: 4,
        originalText: '- Use parameterized queries or prepared statements\n- Validate all input data\n- Use white list input validation\n- Escape all user supplied input',
        translatedText: '- Օգտագործել պարամետրավորված հարցումներ կամ նախապատրաստված հայտարարություններ\n- Վավերացնել բոլոր մուտքային տվյալները\n- Օգտագործել սպիտակ ցանկի մուտքային վավերացում\n- Խուսափել բոլոր օգտատիրոջ տրամադրված մուտքից',
        status: 'in-progress',
        translatorNotes: 'Need to review "white list" translation - might use "սպիտակ ցանկ" or "թույլատրված ցանկ"',
        reviewComments: [
          {
            id: 'comment-2',
            reviewerId: 'user-2',
            segmentId: 'segment-5',
            commentText: 'Consider using "թույլատրված ցանկի" instead of "սպիտակ ցանկի" for better Armenian style',
            type: 'suggestion',
            severity: 'medium',
            createdAt: '2024-01-16T10:00:00Z',
            resolved: false
          }
        ],
        lastModified: '2024-01-15T14:00:00Z',
        estimatedWords: 20,
        actualWords: 25
      }
    ];

    initialSegments.forEach(segment => {
      translationSegmentsStorage.set(segment.id, segment);
    });
    
    MockDataStorage.initialized = true;
  }

  // Translation Projects methods
  public static addTranslationProject(project: TranslationProject): void {
    translationProjectsStorage.set(project.id, project);
  }

  public static getTranslationProject(id: string): TranslationProject | undefined {
    return translationProjectsStorage.get(id);
  }

  public static getAllTranslationProjects(): TranslationProject[] {
    return Array.from(translationProjectsStorage.values());
  }

  // Translation Segments methods
  public static addTranslationSegment(segment: TranslationSegment): void {
    translationSegmentsStorage.set(segment.id, segment);
  }

  public static addTranslationSegments(segments: TranslationSegment[]): void {
    segments.forEach(segment => MockDataStorage.addTranslationSegment(segment));
  }

  public static getTranslationSegmentsByProjectId(projectId: string): TranslationSegment[] {
    const segments = Array.from(translationSegmentsStorage.values())
      .filter(segment => segment.translationProjectId === projectId);
    return segments;
  }

  public static getTranslationSegment(id: string): TranslationSegment | undefined {
    return translationSegmentsStorage.get(id);
  }
}

// Initialize data
MockDataStorage.initializeData();

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'arman@example.com',
    name: 'Arman Petrosyan',
    githubUsername: 'armanp',
    expertiseAreas: ['Network Security', 'Penetration Testing'],
    isModerator: false,
    contributionCount: 12,
    certificatesEarned: 8
  },
  {
    id: 'user-2',
    email: 'anna@example.com',
    name: 'Anna Grigoryan',
    githubUsername: 'annag',
    expertiseAreas: ['Digital Forensics', 'Malware Analysis'],
    isModerator: true,
    contributionCount: 28,
    certificatesEarned: 15
  },
  {
    id: 'user-3',
    email: 'davit@example.com',
    name: 'Davit Sargsyan',
    githubUsername: 'davits',
    expertiseAreas: ['Web Security', 'OWASP'],
    isModerator: false,
    contributionCount: 7,
    certificatesEarned: 4
  }
];

// Mock Cybersecurity Projects
export const mockCyberSecProjects: CyberSecProject[] = [
  {
    id: 'project-1',
    name: 'OWASP Top 10',
    owner: 'OWASP',
    description: 'The OWASP Top 10 is a standard awareness document for developers and web application security.',
    category: 'web-security',
    docsPath: '/docs/README.md',
    githubUrl: 'https://github.com/OWASP/Top10',
    difficulty: 'beginner',
    estimatedHours: 8,
    translationProgress: 65,
    availableForTranslation: true
  },
  {
    id: 'project-2',
    name: 'Metasploit Framework',
    owner: 'rapid7',
    description: 'The Metasploit Framework is a Ruby-based, modular penetration testing platform.',
    category: 'pen-testing',
    docsPath: '/documentation/modules/README.md',
    githubUrl: 'https://github.com/rapid7/metasploit-framework',
    difficulty: 'advanced',
    estimatedHours: 24,
    translationProgress: 23,
    availableForTranslation: true
  },
  {
    id: 'project-3',
    name: 'Wireshark User Guide',
    owner: 'wireshark',
    description: 'Network protocol analyzer documentation and user guide.',
    category: 'network-security',
    docsPath: '/doc/README.md',
    githubUrl: 'https://github.com/wireshark/wireshark',
    difficulty: 'intermediate',
    estimatedHours: 16,
    translationProgress: 45,
    availableForTranslation: true
  },
  {
    id: 'project-4',
    name: 'The Sleuth Kit',
    owner: 'sleuthkit',
    description: 'Digital forensics tools and documentation for analyzing disk images.',
    category: 'forensics',
    docsPath: '/docs/README.md',
    githubUrl: 'https://github.com/sleuthkit/sleuthkit',
    difficulty: 'advanced',
    estimatedHours: 20,
    translationProgress: 12,
    availableForTranslation: true
  },
  {
    id: 'project-5',
    name: 'Nmap Documentation',
    owner: 'nmap',
    description: 'Network discovery and security auditing utility documentation.',
    category: 'network-security',
    docsPath: '/docs/nmap.1',
    githubUrl: 'https://github.com/nmap/nmap',
    difficulty: 'intermediate',
    estimatedHours: 12,
    translationProgress: 78,
    availableForTranslation: false
  }
];

// Export the storage access methods using the static methods
export const addTranslationProject = (project: TranslationProject): void => 
  MockDataStorage.addTranslationProject(project);

export const getTranslationProjectById = (id: string): TranslationProject | undefined => 
  MockDataStorage.getTranslationProject(id);

export const getAllTranslationProjects = (): TranslationProject[] => 
  MockDataStorage.getAllTranslationProjects();

export const addTranslationSegments = (segments: TranslationSegment[]): void =>
  MockDataStorage.addTranslationSegments(segments);

export const getTranslationSegmentsByProjectId = (projectId: string): TranslationSegment[] =>
  MockDataStorage.getTranslationSegmentsByProjectId(projectId);

export const getTranslationSegmentById = (id: string): TranslationSegment | undefined =>
  MockDataStorage.getTranslationSegment(id);

// Mock Translation Memory
export const mockTranslationMemory: TranslationMemoryEntry[] = [
  {
    id: 'tm-1',
    originalText: 'vulnerability',
    translatedText: 'խոցելիություն',
    context: 'security',
    category: 'cybersecurity',
    confidence: 0.95,
    createdBy: 'user-1',
    createdAt: '2024-01-10T12:00:00Z',
    usageCount: 15
  },
  {
    id: 'tm-2',
    originalText: 'attack',
    translatedText: 'հարձակում',
    context: 'security',
    category: 'cybersecurity',
    confidence: 0.98,
    createdBy: 'user-2',
    createdAt: '2024-01-08T15:30:00Z',
    usageCount: 23
  },
  {
    id: 'tm-3',
    originalText: 'encryption',
    translatedText: 'գաղտնագրում',
    context: 'cryptography',
    category: 'cybersecurity',
    confidence: 0.99,
    createdBy: 'user-1',
    createdAt: '2024-01-05T09:15:00Z',
    usageCount: 18
  },
  {
    id: 'tm-4',
    originalText: 'authentication',
    translatedText: 'նույնականացում',
    context: 'access control',
    category: 'cybersecurity',
    confidence: 0.97,
    createdBy: 'user-3',
    createdAt: '2024-01-12T11:45:00Z',
    usageCount: 12
  },
  {
    id: 'tm-5',
    originalText: 'unauthorized access',
    translatedText: 'չթույլատրված մուտք',
    context: 'security breach',
    category: 'cybersecurity',
    confidence: 0.92,
    createdBy: 'user-2',
    createdAt: '2024-01-14T16:20:00Z',
    usageCount: 8
  }
];

// Mock Certificates
export const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    userId: 'user-1',
    projectId: 'translation-1',
    projectName: 'OWASP Top 10',
    githubRepo: 'OWASP/Top10',
    prUrl: 'https://github.com/OWASP/Top10/pull/567',
    mergedAt: '2024-01-20T16:45:00Z',
    certificateType: 'translation',
    category: 'Web Security',
    verificationCode: 'CYBS-CERT-2024-001',
    pdfUrl: '/certificates/cert-1.pdf'
  },
  {
    id: 'cert-2',
    userId: 'user-3',
    projectId: 'translation-2',
    projectName: 'Wireshark User Guide',
    githubRepo: 'wireshark/wireshark',
    prUrl: 'https://github.com/wireshark/wireshark/pull/1234',
    mergedAt: '2024-01-18T11:30:00Z',
    certificateType: 'translation',
    category: 'Network Security',
    verificationCode: 'CYBS-CERT-2024-002',
    pdfUrl: '/certificates/cert-2.pdf'
  }
];

// Mock Review Tasks
export const mockReviewTasks: ReviewTask[] = [
  {
    id: 'review-1',
    translationProjectId: 'translation-1',
    reviewerId: 'user-2',
    status: 'in-progress',
    securityAccuracyScore: 9,
    languageQualityScore: 8,
    comments: 'Excellent technical accuracy. Minor grammar improvements needed in the prevention section.',
    createdAt: '2024-01-16T09:15:00Z',
    detailedFeedback: [
      {
        id: 'comment-1',
        reviewerId: 'user-2',
        segmentId: 'segment-2',
        commentText: 'Good decision to keep SQL, NoSQL terms in English. Consider adding Armenian explanation in parentheses for first occurrence.',
        type: 'suggestion',
        severity: 'low',
        createdAt: '2024-01-16T09:30:00Z',
        resolved: false
      },
      {
        id: 'comment-2',
        reviewerId: 'user-2',
        segmentId: 'segment-5',
        commentText: 'Consider using "թույլատրված ցանկի" instead of "սպիտակ ցանկի" for better Armenian style',
        type: 'suggestion',
        severity: 'medium',
        createdAt: '2024-01-16T10:00:00Z',
        resolved: false
      }
    ]
  }
];

// Mock Translation Sessions
export const mockTranslationSessions: TranslationSession[] = [
  {
    id: 'session-1',
    translationProjectId: 'translation-1',
    userId: 'user-1',
    startTime: '2024-01-15T10:30:00Z',
    endTime: '2024-01-15T14:00:00Z',
    segmentsWorked: 5,
    wordsTranslated: 98,
    autoSaves: 23
  },
  {
    id: 'session-2',
    translationProjectId: 'translation-1',
    userId: 'user-1',
    startTime: '2024-01-16T09:00:00Z',
    segmentsWorked: 2,
    wordsTranslated: 45,
    autoSaves: 12
  }
];

// Helper functions
export const getCurrentUser = (): User => mockUsers[0];

export const getCyberSecProjectById = (id: string): CyberSecProject | undefined => 
  mockCyberSecProjects.find(project => project.id === id);

export const getUserById = (id: string): User | undefined =>
  mockUsers.find(user => user.id === id);

export const getCertificatesByUserId = (userId: string): Certificate[] =>
  mockCertificates.filter(cert => cert.userId === userId);

export const getAvailableCyberSecProjects = (): CyberSecProject[] =>
  mockCyberSecProjects.filter(project => project.availableForTranslation);

export const getUserTranslationProjects = (userId: string): TranslationProject[] =>
  getAllTranslationProjects().filter(project => project.assignedTranslatorId === userId);

export const getReviewTasksByReviewerId = (reviewerId: string): ReviewTask[] =>
  mockReviewTasks.filter(task => task.reviewerId === reviewerId);

export const getTranslationMemoryMatches = (text: string): TranslationMemoryEntry[] => {
  const lowercaseText = text.toLowerCase();
  return mockTranslationMemory
    .filter(entry => 
      lowercaseText.includes(entry.originalText.toLowerCase()) ||
      entry.originalText.toLowerCase().includes(lowercaseText)
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
};

export const getActiveTranslationSession = (projectId: string, userId: string): TranslationSession | undefined =>
  mockTranslationSessions.find(session => 
    session.translationProjectId === projectId && 
    session.userId === userId && 
    !session.endTime
  ); 