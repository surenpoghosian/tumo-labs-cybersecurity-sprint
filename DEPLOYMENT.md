# Vercel Deployment Guide

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/armenian-docs-translate)

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Vercel account
- GitHub account (optional, for GitHub integration)

## 🔧 Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Vercel Deployment Methods

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings:
     - **Framework Preset**: Next.js
     - **Root Directory**: `./` (project root)
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
     - **Install Command**: `npm install`

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

## ⚙️ Environment Variables

Configure these environment variables in your Vercel dashboard:

### Required Variables
```env
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_APP_NAME=Armenian CyberSec Docs
```

### Optional Variables (for production features)
```env
# GitHub Integration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Database (when you upgrade from mock data)
DATABASE_URL=your_database_url

# Email Notifications
EMAIL_FROM=noreply@your-domain.com
EMAIL_API_KEY=your_email_service_api_key

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key

# Analytics
GOOGLE_ANALYTICS_ID=your_google_analytics_id
```

## 📁 Project Structure

```
armenian-docs-translate/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── components/     # React components
│   │   ├── lib/           # Utility functions
│   │   └── types/         # TypeScript types
├── public/                 # Static assets
├── package.json           # Dependencies
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── vercel.json           # Vercel deployment configuration
```

## 🔧 Vercel Configuration

The `vercel.json` file includes:
- Build command configuration
- API routes optimization
- Runtime specifications
- Environment variable mappings

## 📊 Performance Optimizations

### Current Optimizations
- ✅ Next.js 15 with App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for efficient styling
- ✅ Static generation where possible
- ✅ API route optimization

### Recommended Additions
- [ ] Image optimization with Next.js Image
- [ ] Database connection pooling
- [ ] Redis caching for API responses
- [ ] CDN configuration for static assets

## 🚦 Health Checks

After deployment, verify:

1. **Homepage loads**: `https://your-app.vercel.app`
2. **API endpoints work**: `https://your-app.vercel.app/api/projects`
3. **Translation flow**: Navigate from projects to translation pages
4. **Certificate generation**: Test certificate functionality

## 🔍 Troubleshooting

### Common Issues

1. **Build Errors**
   - Check TypeScript errors: `npm run build`
   - Verify all dependencies are installed
   - Check import paths

2. **API Routes Not Working**
   - Verify `vercel.json` configuration
   - Check function timeout limits
   - Review server logs in Vercel dashboard

3. **Environment Variables**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Redeploy after adding new variables

### Debug Commands
```bash
# Check build locally
npm run build

# Run production build locally
npm run start

# Check TypeScript errors
npx tsc --noEmit

# Check for unused dependencies
npm run lint
```

## 📈 Monitoring

### Vercel Analytics
- Enable in Vercel dashboard
- Monitor page performance
- Track API response times

### Error Tracking
- Consider adding Sentry for error tracking
- Monitor API endpoint failures
- Track user journey issues

## 🔄 Continuous Deployment

### Auto-Deploy Setup
1. Connect GitHub repository to Vercel
2. Configure branch protection rules
3. Set up automatic deployments on push to main
4. Configure preview deployments for PR branches

### Pre-Deploy Checklist
- [ ] All tests passing
- [ ] Build completes successfully
- [ ] Environment variables configured
- [ ] Database migrations applied (if applicable)
- [ ] Static assets optimized

## 🎯 Next Steps

After successful deployment:
1. **Custom Domain**: Add your domain in Vercel dashboard
2. **SSL Certificate**: Automatically provided by Vercel
3. **Performance Monitoring**: Set up analytics and monitoring
4. **Database Migration**: Replace mock data with real database
5. **GitHub Integration**: Add real GitHub API integration
6. **User Authentication**: Implement proper user management

## 📞 Support

For deployment issues:
- Check Vercel documentation
- Review build logs in Vercel dashboard
- Contact support if needed

---

**Happy Deploying! 🚀** 