// MongoDB Schema Definitions for Migration
const { ObjectId } = require('mongodb');

// Users Collection (from userProfiles)
const userSchema = {
  _id: ObjectId,
  uid: String, // Firebase UID, will become internal ID
  email: String,
  name: String,
  username: String,
  githubUsername: String,
  role: { type: String, enum: ['contributor', 'bot', 'moderator', 'administrator'] },
  expertiseAreas: [String],
  statistics: {
    totalCredits: Number,
    approvedTranslations: Number,
    rejectedTranslations: Number,
    totalWordsTranslated: Number,
    contributionCount: Number,
    certificatesEarned: Number
  },
  certificates: [ObjectId], // References to certificates collection
  currentFiles: { type: Map, of: String }, // fileId -> fileName
  contributedFiles: { type: Map, of: String },
  createdAt: Date,
  updatedAt: Date,
  lastActive: Date
};

// Projects Collection
const projectSchema = {
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  title: String,
  version: String,
  description: String,
  developedBy: String,
  difficulty: { type: Number, min: 1, max: 5 },
  source: String, // GitHub URL
  categories: [String],
  status: { type: String, enum: ['not started', 'in progress', 'completed'] },
  files: [ObjectId], // References to documents collection
  estimatedHours: Number,
  translationProgress: Number,
  availableForTranslation: Boolean,
  lastSyncedAt: Date,
  lastSyncSha: String,
  createdAt: Date,
  updatedAt: Date
};

// Documents Collection (from files)
const documentSchema = {
  _id: ObjectId,
  projectId: ObjectId,
  userId: ObjectId,
  fileName: String,
  filePath: String,
  folderPath: String,
  originalText: String, // Consider GridFS for large files
  translatedText: String,
  status: { type: String, enum: ['not taken', 'in progress', 'pending', 'rejected', 'accepted'] },
  assignedTranslatorId: ObjectId,
  reviewerId: ObjectId,
  translations: [{
    _id: ObjectId,
    text: String,
    comment: String,
    isHumanTranslated: Boolean,
    username: String,
    userId: ObjectId,
    createdAt: Date,
    status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'] },
    reviewComments: [String]
  }],
  metadata: {
    wordCount: Number,
    estimatedHours: Number,
    actualHours: Number,
    fileSize: Number,
    storageType: { type: String, enum: ['database', 'filesystem', 'minio'] },
    contentUrl: String, // For external storage
    githubSha: String,
    lastSyncedAt: Date
  },
  visibility: { type: String, enum: ['public', 'private', 'unlisted'] },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date
};

// Reviews Collection
const reviewSchema = {
  _id: ObjectId,
  fileId: ObjectId,
  translationId: ObjectId,
  reviewerId: ObjectId,
  userId: ObjectId, // Original translator
  status: { type: String, enum: ['pending', 'in-progress', 'approved', 'rejected'] },
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  scores: {
    securityAccuracy: Number,
    languageQuality: Number
  },
  comments: String,
  reviewType: { type: String, enum: ['translation', 'content', 'security'] },
  category: String,
  dueDate: Date,
  estimatedReviewTime: Number,
  createdAt: Date,
  updatedAt: Date
};

// Certificates Collection
const certificateSchema = {
  _id: ObjectId,
  userId: ObjectId,
  username: String,
  fullName: String,
  projectId: ObjectId,
  projectName: String,
  fileId: ObjectId,
  githubRepo: String,
  prUrl: String,
  mergedAt: Date,
  type: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'sigma', 'alpha'] },
  certificateType: { type: String, enum: ['translation', 'review', 'contribution'] },
  category: String,
  verificationCode: String, // Unique verification code
  pdfPath: String, // Local file path instead of URL
  metadata: {
    wordsTranslated: Number,
    filesCompleted: Number,
    reviewsPassed: Number
  },
  createdAt: Date
};

// Translation Memory Collection
const translationMemorySchema = {
  _id: ObjectId,
  userId: ObjectId,
  originalText: String,
  translatedText: String,
  context: String,
  category: String,
  confidence: Number,
  usageCount: Number,
  projectId: ObjectId,
  fileId: ObjectId,
  createdAt: Date,
  lastUsed: Date
};

// Indexes for performance
const indexes = {
  users: [
    { email: 1 },
    { username: 1 },
    { githubUsername: 1 },
    { role: 1, lastActive: -1 }
  ],
  projects: [
    { userId: 1 },
    { status: 1, availableForTranslation: 1 },
    { categories: 1 },
    { source: 1 }
  ],
  documents: [
    { projectId: 1, status: 1 },
    { assignedTranslatorId: 1, status: 1 },
    { 'metadata.wordCount': -1 },
    { visibility: 1, publishedAt: -1 }
  ],
  reviews: [
    { fileId: 1, status: 1 },
    { reviewerId: 1, status: 1 },
    { dueDate: 1, priority: -1 }
  ],
  certificates: [
    { userId: 1, type: -1 },
    { verificationCode: 1 },
    { projectId: 1 }
  ],
  translationMemory: [
    { userId: 1, category: 1 },
    { originalText: 'text', translatedText: 'text' }, // Text index for search
    { confidence: -1, usageCount: -1 }
  ]
};

module.exports = {
  schemas: {
    userSchema,
    projectSchema,
    documentSchema,
    reviewSchema,
    certificateSchema,
    translationMemorySchema
  },
  indexes
};