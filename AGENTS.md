# LLM Agent Prompt – Build & Evolve the Candidate‑to‑Professional Platform

## 0. Mission Statement

Deliver a **lean, production‑grade web app that is visually minimalistic and slick** that lets:
1. Candidates book **paid virtual coffee chats** with professionals
2. Professionals earn their **session fee** immediately after submitting written feedback
3. Professionals collect an **offer‑bonus** if that candidate later accepts an offer at their firm
4. Professionals grow the network via a **multi‑level referral program** that pays a slice of every referred chat into perpetuity
5. Stack: **Next.js + MongoDB Atlas + Stripe Connect + AWS Services**, 100% serverless, simple enough that any mid‑level dev can onboard in < 30 minutes

---

## 1. Tech Stack (Serverless‑First)

| Layer              | Choice                                | Why                                            | Status        |
| ------------------ | ------------------------------------- | ---------------------------------------------- | ------------- |
| UI + API           | **Next.js 15 (App Router) + TypeScript** | SSR + edge API routes in one repo             | ✅ Implemented |
| Database           | **MongoDB Atlas**                     | Flexible schema, works with Mongoose          | ✅ Implemented |
| Auth               | **NextAuth.js (OAuth)**               | Google/LinkedIn OAuth only, no passwords      | ✅ Implemented |
| Payments           | **Stripe Connect**                    | Handles split payouts & platform fees         | 🚧 In Progress |
| File Storage       | **AWS S3**                           | Presigned URLs for secure direct uploads      | ✅ Implemented |
| Email              | **AWS SES**                          | Transactional emails with domain verification | 🔄 Planned     |
| Video Meetings     | **Zoom SDK**                         | Professional video calls with recording       | 🔄 Planned     |
| Calendar           | **Google Calendar API**               | Availability sync + manual override           | 🚧 In Progress |
| Jobs               | **AWS Lambda + EventBridge**          | Scheduled tasks (offer bonuses, retries)      | 🔄 Planned     |
| Infra as Code      | **SST (AWS CDK)**                    | Generates AWS + Vercel resources              | 🔄 Planned     |
| Monitoring         | **Axiom/LogRocket/Highlight**         | Modern alternatives to Sentry                 | 🔄 Planned     |
| Testing            | **Vitest + Playwright**               | ≥95% coverage target                          | 🔄 Planned     |

*No Docker needed in prod; local development uses mock data for rapid iteration.*

---

## 2. Implementation Status

### ✅ **Completed Features**

#### Authentication & Profile Management
- OAuth-only authentication (Google/LinkedIn)
- Role-based route protection with `useAuthGuard` hook
- Multi-step profile completion (candidate: 3 steps, professional: 3 steps)
- Role selection after OAuth with immediate redirect
- Profile validation and completion tracking

#### File Upload System
- AWS S3 integration with presigned URLs
- Client-side file validation (type, size)
- Progress tracking for uploads
- Support for resumes (PDF/DOC) and profile pictures
- Automatic cleanup of temporary object URLs

#### User Management
- Comprehensive Mongoose schemas for candidates and professionals
- Role-specific field validation
- Professional expertise tagging system
- Candidate offer bonus pledge system

#### UI/UX Implementation
- Physics-based animations with cubic-bezier timing
- Split-pane dashboard layouts
- Responsive design with Tailwind CSS
- Modal system with accessibility features
- Loading states and error handling

#### Mock Data System
- Comprehensive development data with realistic scenarios
- Multiple user types and session statuses
- Sample feedback, ratings, and referral chains
- One-command setup for new developers

### 🚧 **In Progress Features**

#### Session Management
- Basic booking API structure implemented
- Payment intent creation with Stripe
- Session status tracking (requested/confirmed/completed)
- Professional acceptance/decline workflow
- **TODO**: Complete Stripe Checkout integration
- **TODO**: Zoom meeting creation on confirmation
- **TODO**: Google Calendar event creation

#### Payment Processing
- Stripe Connect account creation for professionals
- Basic payout calculation logic
- Referral chain calculation algorithm
- **TODO**: Complete webhook handlers for payment events
- **TODO**: Implement payment failure recovery
- **TODO**: Add refund handling for cancelled sessions

#### Dashboard Functionality
- Candidate search and professional discovery
- Session history and upcoming sessions display
- Basic earnings tracking for professionals
- **TODO**: Real-time status updates
- **TODO**: Notification system integration

### 🔄 **Planned Features**

#### Calendar Integration
- Google Calendar OAuth scope configured
- **TODO**: Free/busy time queries
- **TODO**: Manual availability override system
- **TODO**: Timezone handling for global users
- **TODO**: Buffer time and conflict detection

#### Video Meeting Integration
- **TODO**: Zoom SDK integration
- **TODO**: Meeting creation and management
- **TODO**: Recording capabilities
- **TODO**: Meeting link security

#### Email System
- **TODO**: AWS SES configuration
- **TODO**: Email templates for notifications
- **TODO**: Confirmation, reminder, and feedback emails
- **TODO**: Bounce and complaint handling

#### Testing Framework
- **TODO**: Vitest setup for unit tests
- **TODO**: Playwright E2E test structure
- **TODO**: Mock data for testing
- **TODO**: CI/CD pipeline integration

#### Infrastructure
- **TODO**: SST stack configuration
- **TODO**: AWS Lambda functions for scheduled tasks
- **TODO**: CloudWatch monitoring and alerts
- **TODO**: Production deployment automation

---

## 3. Core Domain Flows

### 3.1 Session‑Fee Flow

**Current Implementation:**
1. **Booking** → candidate searches professionals → selects time → Stripe PaymentIntent created
2. **Professional acceptance** → receives request → accepts/declines via API
3. **Chat confirmation** → Zoom meeting created → calendar events added
4. **Feedback submission** → professional submits structured feedback → instant payout triggered

**API Endpoints:**
- `POST /api/sessions/book` - Create session with payment intent
- `POST /api/sessions/[id]/confirm` - Professional accepts/declines
- `POST /api/feedback/professional` - Submit feedback & trigger payouts

**Payment Flow:**
```typescript
const sessionPayout = sessionFee × (1 - platformFee - totalReferralBonuses)
const platformFee = netAmount × 0.05 // Applied after referrals
```

### 3.2 Offer‑Bonus Flow

**Implementation Status:** ✅ Core logic implemented, 🔄 Scheduled processing needed

| # | Event | Implementation Status | API Endpoint |
|---|-------|----------------------|-------------|
| 1 | Candidate signup → enters `$offerBonusCents` | ✅ Complete | `POST /api/auth/complete-profile` |
| 2 | First chat with firm F → cache `firstChatProId` | ✅ Complete | Automated in booking flow |
| 3 | `OfferAccepted` created when reported | ✅ Complete | `POST /api/offers` |
| 4 | Bonus payout to `firstChatProId` | ✅ Logic implemented | `PUT /api/offers` |
| 5 | Email notifications | 🔄 Planned | AWS SES integration |

### 3.3 Referral Program

**Current Implementation:** ✅ Complete calculation logic, 🚧 Payout processing

```typescript
// Multi-level referral calculation
const calculateReferralBonus = (grossAmount: number, level: number): number => {
  if (level < 1 || level > 10) return 0;
  const bonusRate = 0.10 * Math.pow(0.10, level - 1); // 10%, 1%, 0.1%, etc.
  return Math.round(grossAmount * bonusRate);
};
```

**Referral Chain Processing:**
- Level 1: 10% of gross session fee
- Level 2: 1% of gross session fee
- Level 3: 0.1% of gross session fee
- Continues to level 10 (cap for performance)

**Database Models:**
```typescript
// ReferralEdge tracks each payout in the chain
interface ReferralEdge {
  sessionId: string;
  referrerProId: string;
  level: number;
  bonusCents: number;
  stripeTransferId?: string;
  paidAt?: Date;
}
```

### 3.4 Feedback System

**Implementation Status:** ✅ Complete

**Professional → Candidate:**
- Structured ratings: Cultural Fit, Interest, Technical (1-5 stars)
- Written feedback (20-500 characters)
- Internal notes (not shared with candidate)
- Automatic payout trigger on submission

**Candidate → Professional:**
- 1-5 star rating
- Optional written review
- Displayed on professional profiles

---

## 4. API Architecture

### 4.1 Authentication APIs
```typescript
POST /api/auth/setup              // Set role after OAuth
POST /api/auth/complete-profile   // Complete role-specific profile  
GET /api/auth/profile/[id]        // Get profile data
```

### 4.2 Session Management APIs
```typescript
POST /api/sessions/book           // Create session + payment intent
GET /api/sessions/candidate/[id]  // Get candidate's sessions
GET /api/sessions/professional/[id] // Get professional's sessions
POST /api/sessions/[id]/confirm   // Accept/decline session request
```

### 4.3 File Upload APIs
```typescript
POST /api/upload                  // Generate S3 presigned URL
DELETE /api/upload?key=s3-key     // Delete file from S3
```

### 4.4 Professional Services APIs
```typescript
GET /api/professional/search      // Search with filters
GET /api/professional/[id]        // Get professional details
```

### 4.5 Payment & Feedback APIs
```typescript
POST /api/feedback/professional   // Submit feedback + trigger payouts
POST /api/offers                  // Report job offer
PUT /api/offers                   // Accept offer + trigger bonus
```

### 4.6 Planned APIs
```typescript
// Calendar Integration
GET /api/calendar/availability    // Get free/busy times
POST /api/calendar/events         // Create session events
PUT /api/calendar/availability    // Update manual availability

// Video Meetings  
POST /api/zoom/meetings           // Create Zoom meeting
GET /api/zoom/meetings/[id]       // Get meeting details

// Email System
POST /api/email/send              // Send transactional email
POST /api/email/template          // Render email template

// Webhooks
POST /api/webhooks/stripe         // ✅ Implemented
POST /api/webhooks/zoom           // 🔄 Planned
```

---

## 5. Database Schema

### 5.1 User Model (Implemented)
```typescript
interface IUser {
  email: string;
  name: string;
  role: "candidate" | "professional";
  profileImageUrl?: string;
  
  // Verification
  schoolEmail?: string;
  workEmail?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
  
  // Candidate fields
  school?: string;
  major?: string;
  targetRole?: string;
  offerBonusCents?: number;
  
  // Professional fields  
  title?: string;
  company?: string;
  sessionRateCents?: number;
  stripeAccountId?: string;
  expertise?: string[];
  referredBy?: string;
}
```

### 5.2 Session Model (Implemented)
```typescript
interface ISession {
  candidateId: string;
  professionalId: string;
  firmId: string;
  referrerProId?: string;
  scheduledAt: Date;
  rateCents: number;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  zoomJoinUrl?: string;
  stripePaymentIntentId?: string;
  stripeTransferIds?: string[];
  isFirstChatAtFirm?: boolean;
}
```

### 5.3 Feedback Models (Implemented)
```typescript
interface IProfessionalFeedback {
  sessionId: string;
  culturalFitRating: number;    // 1-5
  interestRating: number;       // 1-5  
  technicalRating: number;      // 1-5
  feedback: string;             // 20-500 chars
  internalNotes?: string;       // Not shared
}

interface ICandidateRating {
  sessionId: string;
  rating: number;               // 1-5
  review?: string;              // Optional text
}
```

---

## 6. Repository Layout

```
/src/
├── app/                        # Next.js App Router
│   ├── api/                    # Vercel Functions
│   │   ├── auth/               # ✅ OAuth & profile completion
│   │   ├── sessions/           # ✅ Booking & management
│   │   ├── feedback/           # ✅ Ratings & payouts
│   │   ├── offers/             # ✅ Offer tracking
│   │   ├── professional/       # ✅ Search & profiles
│   │   ├── upload/             # ✅ S3 file uploads
│   │   ├── calendar/           # 🔄 Google Calendar integration
│   │   ├── zoom/               # 🔄 Video meeting management
│   │   ├── email/              # 🔄 SES email sending
│   │   └── webhooks/           # 🚧 Stripe (partial), Zoom (planned)
│   ├── auth/                   # ✅ Authentication pages
│   ├── candidate/              # ✅ Candidate dashboard & search
│   ├── professional/           # ✅ Professional dashboard
│   ├── components/             # ✅ React components
│   └── globals.css             # ✅ Tailwind + animations
├── lib/
│   ├── models/                 # ✅ Mongoose schemas
│   ├── api/                    # ✅ Error handling & middleware
│   ├── auth.ts                 # ✅ NextAuth configuration
│   ├── db.ts                   # ✅ MongoDB connection
│   ├── upload.ts               # ✅ S3 utilities
│   ├── calendar.ts             # 🔄 Google Calendar
│   ├── zoom.ts                 # 🔄 Zoom SDK
│   ├── email.ts                # 🔄 AWS SES
│   └── utils.ts                # ✅ Helper functions
├── hooks/
│   └── useAuthGuard.ts         # ✅ Route protection
├── components/ui/              # ✅ Shared components
├── middleware.ts               # ✅ NextAuth protection
├── tests/                      # 🔄 Testing framework
│   ├── unit/                   # Vitest tests
│   ├── integration/            # Playwright E2E
│   └── fixtures/               # Test data
├── stacks/                     # 🔄 SST infrastructure
│   ├── WebStack.ts             # Vercel deployment
│   ├── StorageStack.ts         # S3 + CloudFront  
│   ├── EmailStack.ts           # SES configuration
│   └── sst.config.ts           # SST configuration
└── scripts/
    └── mockData.ts             # ✅ Development data loader
```

---

## 7. Quality & Testing Standards

### 7.1 Testing Strategy (Planned Implementation)

**Unit Tests (Vitest)**
- All utility functions and API logic
- Mongoose model validation
- Payment calculation algorithms
- Referral chain processing
- Target: ≥95% coverage for critical paths

**Integration Tests (Playwright)**
- Complete user journeys (signup → booking → feedback)
- Payment flows with mock Stripe
- Multi-level referral scenarios
- File upload and calendar integration
- Cross-browser testing (Chrome, Firefox, Safari)

**Test Structure:**
```
tests/
├── unit/
│   ├── lib/utils.test.ts       # Helper functions
│   ├── lib/referrals.test.ts   # Referral calculations
│   └── api/sessions.test.ts    # API logic
├── integration/
│   ├── auth-flow.spec.ts       # OAuth → profile setup
│   ├── booking-flow.spec.ts    # Search → book → pay
│   ├── feedback-flow.spec.ts   # Submit → payout
│   └── referral-flow.spec.ts   # Multi-level referrals
└── fixtures/
    ├── users.json              # Test user data
    └── sessions.json           # Test session data
```

### 7.2 Code Quality Gates

**Pre-commit Hooks (Husky)**
- ESLint + Prettier formatting
- TypeScript compilation check
- Unit test execution
- Conventional commit validation

**CI/CD Pipeline**
```yaml
# .github/workflows/ci.yml
test:
  - npm run lint
  - npm run test:unit
  - npm run test:e2e
  - npm run build
deploy:
  - npm run sst:deploy (staging)
  - Lighthouse performance check
  - npm run sst:deploy (production)
```

**Performance Targets**
- Lighthouse Score: ≥90 (mobile & desktop)
- Core Web Vitals: All "Good" ratings
- API Response Times: <200ms P95
- Database Query Times: <100ms P95

---

## 8. Infrastructure as Code (SST)

### 8.1 Stack Architecture (Planned)

```typescript
// stacks/WebStack.ts
export function WebStack({ stack }: StackContext) {
  // Vercel deployment configuration
  const site = new NextjsSite(stack, "site", {
    environment: {
      MONGODB_URI: process.env.MONGODB_URI!,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
    },
  });
}

// stacks/StorageStack.ts  
export function StorageStack({ stack }: StackContext) {
  const bucket = new Bucket(stack, "uploads");
  const cdn = new CloudfrontDistribution(stack, "cdn", {
    defaultBehavior: {
      origin: bucket,
    },
  });
}

// stacks/EmailStack.ts
export function EmailStack({ stack }: StackContext) {
  const emailIdentity = new SesEmailIdentity(stack, "domain", {
    email: "yourdomain.com",
  });
}
```

### 8.2 AWS Resources

**S3 Configuration**
- File uploads with lifecycle policies
- CloudFront CDN for global delivery
- CORS configuration for web uploads

**SES Configuration**  
- Domain verification and DKIM
- Email templates for notifications
- Bounce and complaint handling

**Lambda Functions**
- Scheduled offer bonus processing
- Email queue processing  
- Cleanup and maintenance tasks

**CloudWatch**
- Application logs and metrics
- Performance monitoring
- Error rate alerts

---

## 9. Security Implementation

### 9.1 Authentication Security ✅
- OAuth-only (no password storage)
- JWT tokens with secure HTTP-only cookies
- Role-based route protection
- Session validation on sensitive operations

### 9.2 Payment Security ✅  
- Stripe Connect for PCI compliance
- Webhook signature verification
- Idempotent transfer operations
- Platform fee validation

### 9.3 File Upload Security ✅
- Presigned URL expiration (5 minutes)
- File type and size validation
- Virus scanning (planned with ClamAV)
- Public read-only access control

### 9.4 API Security ✅
- Input validation with Zod schemas
- Rate limiting on API endpoints
- CORS configuration
- SQL injection prevention (MongoDB)

### 9.5 Data Privacy
- GDPR compliance considerations
- Data retention policies
- User data export/deletion
- Audit logging for sensitive operations

---

## 10. Monitoring & Observability (Planned)

### 10.1 Error Tracking Alternatives to Sentry

**Axiom** (Recommended)
- Modern observability platform
- Excellent Next.js integration
- Real-time search and analytics
- Competitive pricing

**LogRocket**
- Session replay with error tracking
- Performance monitoring
- User behavior insights
- Great for debugging UX issues

**Highlight** (Open Source)
- Self-hostable alternative
- Full-stack error tracking
- Session replay capabilities
- Cost-effective for startups

### 10.2 Key Metrics

**Business Metrics**
- Session booking conversion rates
- Professional acceptance rates
- Average session fee and completion rate
- Referral chain performance
- Offer bonus conversion

**Technical Metrics**
- API response times (P50, P95, P99)
- Database query performance
- File upload success rates
- Payment processing times
- Error rates by endpoint

**User Experience Metrics**
- Page load times
- Core Web Vitals
- Mobile vs desktop usage
- Feature adoption rates
- User retention cohorts

---

## 11. Development Workflow

### 11.1 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Load development data
npm run setup-mock

# 4. Start development server
npm run dev
```

### 11.2 Feature Development Process

1. **Create feature branch** from main
2. **Load mock data** for testing: `npm run setup-mock`
3. **Implement with tests** using watch mode: `npm run test:watch`
4. **Run full test suite** before commit: `npm test && npm run test:e2e`
5. **Commit with conventional commits**: `feat:`, `fix:`, `docs:`
6. **Create PR** with deployment preview
7. **Review and merge** after all checks pass

### 11.3 Deployment Strategy

**Development Environment**
- Automatic deployment on push to `develop` branch
- Uses development Stripe keys and MongoDB
- Mock data available for testing

**Staging Environment**  
- Deployment on push to `staging` branch
- Production-like data but isolated
- E2E test execution environment

**Production Environment**
- Manual deployment from `main` branch
- Blue-green deployment strategy
- Automated rollback on health check failure

---

## 12. Definition of Done

### 12.1 Feature Completion Criteria

**✅ Implementation Complete**
1. All API endpoints implemented with proper error handling
2. UI components with loading states and error boundaries
3. Database models with proper validation
4. File upload integration with progress tracking

**🧪 Testing Complete**
1. Unit tests with ≥95% coverage for payment logic
2. Integration tests for complete user journeys
3. Manual testing on mobile and desktop
4. Accessibility testing with screen readers

**🚀 Deployment Ready**
1. Environment variables configured
2. Infrastructure deployed via SST
3. Monitoring and alerting configured
4. Documentation updated

**📊 Performance Verified**
1. Lighthouse score ≥90 for mobile and desktop
2. API response times <200ms P95
3. No console errors in production
4. Core Web Vitals in "Good" range

**🔒 Security Validated**
1. Penetration testing completed
2. Dependency security scan passing
3. OWASP security checklist verified
4. Data privacy compliance confirmed

### 12.2 Production Readiness Checklist

**Infrastructure**
- [ ] SST stacks deployed to production
- [ ] CloudFront CDN configured
- [ ] AWS SES domain verified
- [ ] MongoDB Atlas production cluster
- [ ] Stripe production webhooks

**Monitoring**
- [ ] Error tracking configured (Axiom/LogRocket/Highlight)
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alert escalation procedures documented

**Security**
- [ ] SSL certificates configured
- [ ] API rate limiting enabled
- [ ] Webhook signature verification
- [ ] File upload virus scanning
- [ ] Data backup and recovery tested

---

## 13. Future Roadmap

### 13.1 Phase 1: Core Platform (Current)
- ✅ Authentication and user management
- ✅ Session booking with payments
- ✅ Feedback and rating system
- ✅ File upload functionality
- 🚧 Referral program completion
- 🔄 Calendar integration
- 🔄 Video meeting integration

### 13.2 Phase 2: Enhanced Experience
- 🔄 Email notification system
- 🔄 Mobile-responsive optimizations  
- 🔄 Advanced search and filtering
- 🔄 Professional availability management
- 🔄 Automated reminder system

### 13.3 Phase 3: Scale & Optimize
- 🔄 Advanced analytics dashboard
- 🔄 Machine learning recommendations
- 🔄 Multi-language support
- 🔄 Enterprise customer features
- 🔄 White-label platform options

### 13.4 Phase 4: Expansion
- 🔄 Additional industries beyond finance/consulting
- 🔄 Group sessions and workshops
- 🔄 Mentorship program matching
- 🔄 Career development tracking
- 🔄 Integration marketplace

---

**Ask clarifying questions only if essential—otherwise build with clear comments and comprehensive documentation.**
