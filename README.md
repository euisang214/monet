# Monet - Candidate-to-Professional Platform

A serverless web application that connects job-seeking candidates with experienced professionals for paid virtual coffee chats. Built with Next.js, MongoDB Atlas, Stripe Connect, and AWS services.

## 🎯 Business Model

- **Session Fees**: Candidates pay professionals for 30-minute video consultations
- **Offer Bonuses**: Professionals earn bonuses when candidates join their companies  
- **Referral Network**: Multi-level referral system pays ongoing commissions
- **Instant Payouts**: Professionals receive payments immediately after submitting feedback

## 🏗️ Architecture

- **Frontend/Backend**: Next.js 15 with App Router + TypeScript
- **Database**: MongoDB Atlas with Mongoose ODM
- **Payments**: Stripe Connect for split payouts and KYC
- **File Storage**: AWS S3 with presigned URLs for secure uploads
- **Email**: AWS SES for transactional emails
- **Authentication**: NextAuth.js with Google/LinkedIn OAuth
- **Video Meetings**: Zoom SDK integration
- **Infrastructure**: SST (AWS CDK) + Vercel Functions
- **Monitoring**: Sentry alternatives (Axiom, LogRocket, or Highlight)
- **Testing**: Vitest + Playwright (≥95% coverage target)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Stripe Connect account
- AWS account (for S3, SES, and SST infrastructure)
- Google OAuth credentials (for calendar integration)
- Zoom SDK credentials

### 1. Clone and Install

```bash
git clone <repository-url>
cd monet
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/monet

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=monet-file-uploads-dev

# AWS SES
AWS_SES_FROM_EMAIL=notifications@yourdomain.com
AWS_SES_REGION=us-east-1

# Zoom SDK
ZOOM_API_KEY=your-zoom-api-key
ZOOM_API_SECRET=your-zoom-api-secret
ZOOM_WEBHOOK_SECRET_TOKEN=your-webhook-secret

# Error Monitoring (choose one)
# AXIOM_TOKEN=your-axiom-token
# LOGROCKET_APP_ID=your-logrocket-id
# HIGHLIGHT_PROJECT_ID=your-highlight-id
```

### 3. AWS S3 Setup

#### Step 1: Create AWS Account and IAM User

1. **Sign up for AWS** at https://aws.amazon.com
2. **Create IAM user:**
   - Username: `monet-s3-user`
   - Attach policy: `AmazonS3FullAccess`
   - Save Access Key ID and Secret Access Key

#### Step 2: Create S3 Bucket

1. **Create bucket:** `monet-file-uploads-dev` (globally unique name)
2. **Set CORS policy:**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

3. **Set bucket policy for public read access:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::monet-file-uploads-dev/*"
    }
  ]
}
```

### 4. AWS SES Setup

1. **Verify your domain** in AWS SES console
2. **Request production access** (removes sandbox limitations)
3. **Configure DKIM and SPF** records in your DNS

### 5. Zoom SDK Setup

1. **Create Zoom Marketplace app** at https://marketplace.zoom.us/
2. **Choose SDK app type**
3. **Get API Key and Secret**
4. **Configure webhook endpoints** pointing to your domain

### 6. Database Setup

The application uses MongoDB Atlas with the following collections:
- **User**: Candidates and professionals with role-based fields
- **Session**: Booking and meeting details with status tracking
- **ProfessionalFeedback**: Structured feedback with ratings
- **CandidateRating**: Professional ratings by candidates
- **Offer**: Job offer tracking for bonus payouts
- **ReferralEdge**: Multi-level referral payout tracking

### 7. Load Development Data

```bash
npm run setup-mock
```

This creates realistic sample data including:
- 3 candidates (Alice, John, Sarah)
- 5 professionals from Goldman Sachs, McKinsey, KKR, Bain, JPM
- Various session statuses (pending, confirmed, completed)
- Sample feedback, ratings, and referral chains

### 8. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes (Vercel Functions)
│   │   ├── sessions/           # Session booking & management
│   │   ├── feedback/           # Feedback submission & payouts
│   │   ├── offers/             # Offer tracking & bonuses
│   │   ├── professional/       # Professional onboarding & search
│   │   ├── candidate/          # Candidate signup & management
│   │   ├── upload/             # AWS S3 file upload handling
│   │   ├── calendar/           # Google Calendar integration
│   │   ├── zoom/               # Zoom SDK meeting management
│   │   └── webhooks/           # Stripe & Zoom webhook handlers
│   ├── auth/                   # Authentication pages
│   │   ├── setup/              # Role selection & profile completion
│   │   │   ├── candidate/      # 3-step candidate onboarding
│   │   │   └── professional/   # 3-step professional onboarding
│   │   ├── signin/             # OAuth sign-in page
│   │   └── signup/             # Redirects to signin (OAuth-only)
│   ├── components/             # React components
│   │   ├── EnhancedCandidateDashboard.tsx
│   │   ├── EnhancedProDashboard.tsx
│   │   ├── ProfessionalDirectory.tsx
│   │   └── ui/                 # Reusable UI components
│   ├── candidate/              # Candidate pages
│   │   ├── dashboard/          # Split-pane dashboard with sessions
│   │   └── search/             # Professional search & booking
│   ├── professional/           # Professional pages
│   │   └── dashboard/          # Earnings & session management
│   ├── about/                  # About page
│   ├── how-it-works/           # How it works page
│   └── globals.css             # Tailwind styles + physics animations
├── lib/
│   ├── models/                 # Mongoose schemas
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Database connection with pooling
│   ├── upload.ts               # S3 file upload utilities
│   ├── calendar.ts             # Google Calendar integration
│   ├── zoom.ts                 # Zoom SDK utilities
│   ├── email.ts                # AWS SES email templates
│   └── utils.ts                # Helper functions & API wrapper
├── hooks/
│   └── useAuthGuard.ts         # Role-based route protection
├── components/ui/              # Shared UI components
│   ├── LoadingSpinner.tsx      # Loading states
│   ├── Modal.tsx               # Accessible modal component
│   ├── Navigation.tsx          # Multi-variant navigation
│   └── SessionCard.tsx         # Session display component
└── middleware.ts               # NextAuth route protection
```

## 💰 Money Flow Architecture

### 1. Session Fee Flow
```
Candidate Payment → Stripe PaymentIntent → Session Confirmed → 
Professional Submits Feedback → Instant Payout (90% after fees)
```

### 2. Referral Bonus Flow
```
Professional A refers Candidate → Candidate books with Professional B →
A gets 10% of session fee → If B refers to C, A gets 1% of C's sessions
```

### 3. Offer Bonus Flow
```
Candidate's first chat at Company X → Candidate accepts offer at X →
First chat professional gets candidate's pre-committed bonus
```

## 🛠️ Core APIs

### Authentication & Profile Management
- `POST /api/auth/setup` - Set user role after OAuth
- `POST /api/auth/complete-profile` - Complete role-specific profile
- `GET /api/auth/profile/[id]` - Get profile data for completion

### Session Management
- `POST /api/sessions/book` - Create session & Stripe PaymentIntent
- `POST /api/sessions/[id]/confirm` - Professional accepts/declines
- `GET /api/sessions/candidate/[id]` - Get candidate's sessions
- `GET /api/sessions/professional/[id]` - Get professional's sessions

### File Upload System
- `POST /api/upload` - Generate S3 presigned URLs for secure uploads
- `DELETE /api/upload` - Delete files from S3 (cleanup)

### Calendar Integration
- `GET /api/calendar/availability` - Get user's free/busy times
- `POST /api/calendar/events` - Create calendar events for sessions
- `PUT /api/calendar/availability` - Update manual availability

### Video Meetings
- `POST /api/zoom/meetings` - Create Zoom meetings for sessions
- `GET /api/zoom/meetings/[id]` - Get meeting details
- `POST /api/webhooks/zoom` - Handle Zoom webhook events

### Feedback & Payouts
- `POST /api/feedback/professional` - Submit feedback & trigger payouts
- Automatic referral chain calculation and Stripe transfers

### Professional Services
- `GET /api/professional/search` - Search available professionals
- `GET /api/professional/[id]` - Get professional details

### Offer Tracking
- `POST /api/offers` - Report job offer
- `PUT /api/offers` - Accept offer & trigger bonus payout

## 🎨 Design System

### Physics-Based Animations
- **Spring effects** on primary actions with cubic-bezier bounce
- **Gravity transitions** for navigation and form changes
- **Smooth progress bars** with momentum-based easing
- **Interactive hover states** with scale and shadow effects

### Component Architecture
- **Split-pane dashboards** for optimal information density
- **Progressive disclosure** in signup flows
- **Real-time status updates** for sessions and payments
- **Responsive design** optimized for mobile and desktop

## 🧪 Testing Strategy

### Unit Tests (Vitest)
```bash
npm run test              # Run unit tests
npm run test:watch        # Watch mode for development
npm run test:coverage     # Coverage report (target: ≥95%)
```

### Integration Tests (Playwright)
```bash
npm run test:e2e          # Run end-to-end tests
npm run test:e2e:ui       # Run with UI mode
```

### Test Structure
```
tests/
├── unit/                 # Vitest unit tests
│   ├── lib/              # Library function tests
│   ├── api/              # API route tests
│   └── components/       # Component tests
├── integration/          # Playwright E2E tests
│   ├── auth.spec.ts      # Authentication flows
│   ├── booking.spec.ts   # Session booking flow
│   ├── payments.spec.ts  # Payment processing
│   └── feedback.spec.ts  # Feedback & payout flow
└── fixtures/             # Test data and utilities
```

### Key Test Scenarios
- **Authentication**: OAuth flow → role selection → profile completion
- **Booking**: Search → book → payment → confirmation
- **Session**: Join → complete → feedback → payout
- **Referrals**: Multi-level referral chain payouts
- **Offers**: Report → accept → bonus payout

## 📊 Infrastructure as Code (SST)

### Stack Configuration
```bash
npm run sst:dev           # Deploy to development
npm run sst:deploy        # Deploy to production
npm run sst:remove        # Remove stacks
```

### Stack Architecture
```
stacks/
├── WebStack.ts           # Vercel deployment & environment
├── StorageStack.ts       # S3 buckets & CloudFront CDN
├── EmailStack.ts         # SES configuration & templates
├── MonitoringStack.ts    # CloudWatch & alerts
└── sst.config.ts         # SST configuration
```

### AWS Resources Managed
- **S3 Buckets**: File storage with lifecycle policies
- **CloudFront**: CDN for file delivery
- **SES**: Email sending with domain verification
- **CloudWatch**: Logs and metrics
- **Lambda**: Scheduled functions for cleanup

## 📊 File Upload System

### Secure AWS S3 Integration
- **Presigned URLs** for direct client-to-S3 uploads
- **File validation** on both client and server side
- **Progress tracking** with real-time upload percentages
- **Automatic cleanup** of temporary object URLs

### Supported File Types
- **Resumes**: PDF, DOC, DOCX (up to 10MB)
- **Profile Pictures**: JPEG, PNG, WebP, GIF (up to 10MB)

### File Upload Flow
1. Client validates file type and size
2. Request presigned URL from `/api/upload`
3. Upload directly to S3 using presigned URL
4. Store S3 URL in MongoDB user record
5. Display uploaded file with preview

## 🔄 Calendar Integration

-### Google Calendar Sync
- **OAuth scope**: `https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly`
- **Free/busy queries** for availability checking
- **Automatic event creation** for confirmed sessions
- **Manual availability** editing with override capability

### Availability Management
- **Business hours** enforcement (9 AM–10 PM local time)
- **Buffer time** between sessions (15 minutes)
- **Timezone handling** for global professionals
- **Conflict detection** and resolution

## 📈 Production Deployment

### Vercel Frontend Deployment
1. **Connect GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on git push to main branch

### AWS Infrastructure (SST)
1. **Deploy infrastructure**: `npm run sst:deploy`
2. **Configure domain**: Update DNS to point to CloudFront
3. **SSL certificates**: Automatically provisioned via ACM

### Production Environment Variables
```bash
# Production MongoDB
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/monet-prod

# Production Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production AWS
AWS_S3_BUCKET_NAME=monet-file-uploads-prod
AWS_SES_FROM_EMAIL=notifications@yourdomain.com

# Production URLs
NEXTAUTH_URL=https://yourdomain.com
ZOOM_WEBHOOK_URL=https://yourdomain.com/api/webhooks/zoom
```

### Security Checklist
- ✅ **Presigned URLs** expire in 5 minutes
- ✅ **File type validation** on client and server
- ✅ **Rate limiting** on API endpoints
- ✅ **Input sanitization** with Mongoose schemas
- ✅ **Environment variables** secured in Vercel
- ✅ **Webhook signature verification** for Stripe & Zoom
- ✅ **OAuth-only authentication** (no password storage)
- ✅ **HTTPS enforced** in production

## 🔍 Monitoring & Error Tracking

### Recommended Services (Sentry Alternatives)
- **Axiom**: Modern observability platform with excellent Next.js integration
- **LogRocket**: Session replay with performance monitoring
- **Highlight**: Open-source alternative with self-hosting option

### Key Metrics to Track
- **Session booking conversion** rates
- **Payment processing** success rates
- **Professional response** times
- **Platform fee** calculations
- **API response** times and errors

## 🔒 Security Considerations

- **Payment Security**: All payments processed through Stripe
- **Data Protection**: MongoDB Atlas with encryption at rest
- **Authentication**: OAuth-only, no password storage
- **File Security**: S3 presigned URLs with expiration
- **API Security**: Input validation with Zod schemas
- **Webhook Security**: Signature verification for all webhooks
- **Calendar Security**: Limited OAuth scopes for calendar access

## 📈 Scaling Considerations

- **Serverless Architecture**: Auto-scales with Vercel Functions
- **Database**: MongoDB Atlas with automatic scaling
- **File Storage**: AWS S3 with unlimited capacity
- **CDN**: CloudFront for global file delivery
- **Email**: AWS SES with high delivery rates
- **Video**: Zoom SDK handles meeting infrastructure

## 🆘 Troubleshooting

### Common Development Issues

**Problem**: Environment variables not loading
**Solution**: Restart development server after changing `.env.local`

**Problem**: Database connection errors
**Solution**: Check MongoDB Atlas connection string and IP whitelist

**Problem**: S3 upload failures
**Solution**: Verify IAM permissions and bucket CORS policy

**Problem**: Stripe webhooks failing
**Solution**: Check webhook secret and endpoint URL in Stripe dashboard

**Problem**: Calendar integration errors
**Solution**: Verify Google OAuth scopes and refresh tokens

**Problem**: Zoom meeting creation fails
**Solution**: Check Zoom SDK credentials and API limits

### Development Commands

```bash
# Development
npm run dev              # Start development server with debugging
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run setup-mock      # Load development data

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests
npm run test:coverage   # Generate coverage report

# Infrastructure
npm run sst:dev         # Deploy to development environment
npm run sst:deploy      # Deploy to production
npm run sst:remove      # Remove infrastructure

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Load mock data: `npm run setup-mock`
4. Make changes with tests: `npm run test:watch`
5. Run full test suite: `npm test && npm run test:e2e`
6. Commit with conventional commits: `git commit -am 'feat: add feature'`
7. Push and create Pull Request

### Code Quality Standards
- **ESLint + Prettier** enforced via Husky pre-commit hooks
- **TypeScript strict mode** with no `any` types
- **Test coverage** ≥95% for critical payment flows
- **Lighthouse score** ≥90 for mobile and desktop
- **Conventional Commits** for automated changelog generation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [AWS S3 Developer Guide](https://docs.aws.amazon.com/s3/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Zoom SDK Documentation](https://developers.zoom.us/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [SST Documentation](https://docs.sst.dev/)

---

**Built with ❤️ for the future of professional networking**
