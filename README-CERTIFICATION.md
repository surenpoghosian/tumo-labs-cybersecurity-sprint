# Armenian CyberSec Docs - Certification System

## Overview

The certification system rewards users based on the number of words they have successfully translated and had approved. This creates a gamified experience that encourages continued contribution to the Armenian cybersecurity documentation project.

## Certificate Tiers

The system includes 7 achievement levels based on word count milestones:

| Tier | Name | Words Required | Icon | Description |
|------|------|---------------|------|-------------|
| Bronze | Bronze Translator | 500 | 🥉 | First steps in Armenian cybersecurity translation |
| Silver | Silver Translator | 2,500 | 🥈 | Established contributor to Armenian cybersecurity docs |
| Gold | Gold Translator | 10,000 | 🥇 | Expert Armenian cybersecurity translator |
| Platinum | Platinum Master | 25,000 | 💎 | Elite translator with exceptional contributions |
| Diamond | Diamond Expert | 50,000 | 💠 | Master of Armenian cybersecurity translation |
| Sigma | Sigma Legend | 100,000 | ⭐ | Legendary contributor to Armenian cybersecurity |
| Alpha | Alpha Pioneer | 200,000 | 🏆 | Ultimate pioneer of Armenian cybersecurity education |

## How It Works

### Word Count Tracking
- Words are counted when files are submitted for review
- Word count is added to user's total when translations are **approved** by moderators
- Only approved translations count toward certification milestones

### Certificate Generation
- Certificates are automatically checked when:
  - A user submits a translation for review
  - A translation is approved by a moderator
  - A user visits their dashboard
- Available certificates appear in the dashboard for manual claiming
- Each certificate includes:
  - Unique verification code
  - PDF download capability
  - Tier-specific design and benefits

### Dashboard Integration
- **Current Achievement**: Shows user's highest earned tier
- **Progress Bar**: Visual progress toward next milestone
- **Words to Next**: Exact count of words needed for next certificate
- **Available Certificates**: Ready-to-claim achievements
- **Achievement Notifications**: Special messages for major milestones

## API Endpoints

### Certificate Management
- `GET /api/certificates` - List user's certificates
- `POST /api/certificates/claim` - Claim an available certificate
- `GET /api/certificates/verify/{code}` - Verify certificate authenticity
- `GET /api/certificates/download/{filename}` - Download certificate PDF

### File Processing (triggers certification checks)
- `POST /api/files/[id]/submit-review` - Submit translation (triggers check)
- `POST /api/files/[id]/approve` - Approve translation (triggers word count update)

## Implementation Details

### Core Files
- `src/lib/certificationSystem.ts` - Main certification logic
- `src/lib/userInitialization.ts` - Dashboard integration
- `src/app/dashboard/page.tsx` - UI components
- `src/app/api/certificates/*` - API endpoints

### Database Schema
- `certificates` collection - Individual certificate records
- `userProfiles.certificates[]` - Array of earned certificate IDs
- `userProfiles.totalWordsTranslated` - Running word count total
- `userProfiles.approvedTranslations` - Count of approved files

### Key Functions
- `calculateCertificationProgress()` - Determines current status and next milestone
- `checkAndAwardMilestoneCertificates()` - Automatically awards earned certificates
- `awardCertificate()` - Creates individual certificate records

## User Experience

### Dashboard Features
1. **Visual Progress Tracking**: Progress bars and percentage completion
2. **Milestone Notifications**: Clear indication of available achievements
3. **One-Click Claiming**: Easy certificate claiming process
4. **Achievement Display**: Current tier with icon and description
5. **Goal Setting**: Clear visibility of next milestone requirements

### Certificate Benefits
Each tier includes cumulative benefits:
- **Bronze**: Basic recognition and translation memory access
- **Silver**: Priority project access and enhanced tools
- **Gold**: Review privileges and maintainer communication
- **Platinum**: Mentorship program and development input
- **Diamond**: Co-authorship recognition and advisory board
- **Sigma**: Platform history recognition and academic mentions
- **Alpha**: Named scholarship and permanent advisory role

## Testing

### Manual Testing
1. Create translations and submit for review
2. Use moderator approval endpoint to approve translations
3. Check dashboard for updated progress and available certificates
4. Claim certificates and verify PDF downloads
5. Test certificate verification with generated codes

### API Testing
```bash
# Check user's certification progress
curl -H "Authorization: Bearer {token}" \
  http://localhost:3000/api/dashboard

# Claim a certificate
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"tierId": "bronze"}' \
  http://localhost:3000/api/certificates/claim

# Verify a certificate
curl http://localhost:3000/api/certificates/verify/{verification-code}
```

## Future Enhancements

### Planned Features
- **Email Notifications**: Automatic notifications for new certificates
- **Social Sharing**: Share achievements on social media
- **Certificate Showcase**: Public profiles showing earned certificates
- **Special Events**: Limited-time challenges and bonus certificates
- **Team Achievements**: Group milestone recognition

### Analytics
- Track certification progress across all users
- Identify most effective milestone intervals
- Monitor user engagement with certification system
- Generate insights for platform improvement

## Security Considerations

- All certificates include unique verification codes
- PDF generation is server-side to prevent tampering
- Certificate claiming requires proper authentication
- Firestore security rules prevent certificate manipulation
- Word counts are validated through moderation process 