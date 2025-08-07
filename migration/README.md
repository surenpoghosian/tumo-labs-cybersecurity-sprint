# Migration Files Overview

This directory contains all the necessary files and scripts to migrate the Armenian Docs Translation platform from cloud services to a self-hosted infrastructure.

## Files Created

### 1. **Database Schema & Migration**
- `mongodb-schemas.js` - MongoDB schema definitions for all collections
- `firestore-to-mongodb.js` - Script to migrate data from Firestore to MongoDB

### 2. **Authentication**
- `nextauth-config.ts` - NextAuth.js configuration to replace Firebase Auth

### 3. **Code Updates**
- `code-updates/AuthContext.tsx` - Updated authentication context for NextAuth
- `code-updates/api-projects-route.ts` - Example API route conversion
- `code-updates/lib/mongodb.ts` - MongoDB connection utility
- `code-updates/lib/redis.ts` - Redis client with caching utilities

### 4. **Infrastructure**
- `docker-compose.yml` - Complete Docker setup for all services
- `Dockerfile` - Next.js application container configuration
- `env-template.txt` - Environment variables template

### 5. **Documentation**
- `MIGRATION_GUIDE.md` - Step-by-step migration instructions
- `KEY_CONSIDERATIONS.md` - Important technical considerations and gotchas

## Quick Start

1. **Prepare Environment**
   ```bash
   cp migration/env-template.txt .env.production
   # Edit .env.production with your values
   ```

2. **Run Migration**
   ```bash
   # Install dependencies
   npm install mongodb firebase-admin
   
   # Run data migration
   node migration/firestore-to-mongodb.js
   ```

3. **Deploy Infrastructure**
   ```bash
   # Start all services
   docker-compose -f migration/docker-compose.yml up -d
   ```

4. **Update Application Code**
   - Replace Firebase imports with MongoDB/NextAuth
   - Copy code from `code-updates/` to appropriate locations
   - Update API routes to use new authentication

5. **Test & Validate**
   - Run validation scripts
   - Test all user workflows
   - Monitor performance metrics

## Migration Timeline

- **Week 1-2**: Infrastructure setup
- **Week 3-4**: Database migration
- **Week 5**: Application code updates
- **Week 6**: Testing and validation
- **Week 7**: DNS cutover and go-live

## Support

For questions or issues during migration:
1. Check `KEY_CONSIDERATIONS.md` for common issues
2. Review logs in monitoring services (Grafana/Prometheus)
3. Validate data integrity with migration scripts

## Rollback Plan

If issues arise:
1. Keep Firebase services running during transition
2. Use dual-write mode for critical data
3. DNS can be reverted quickly
4. All data is backed up before migration