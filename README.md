# Monet - Candidate-to-Professional Platform

A serverless web application that connects job-seeking candidates with experienced professionals for paid virtual coffee chats. Built with Next.js, MongoDB Atlas, Stripe Connect, and AWS S3.

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
- **Authentication**: NextAuth.js with Google/LinkedIn OAuth
- **Infrastructure**: Vercel Functions (serverless)
- **Monitoring**: Sentry for error tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Stripe Connect account
- AWS account (for S3 file storage)
- Google OAuth credentials (for calendar integration)

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

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=monet-file-uploads-dev
```

### 3. AWS S3 Setup (Detailed Instructions)

File uploads (resumes, profile pictures) are stored securely in AWS S3. Follow these step-by-step instructions:

#### Step 1: Create AWS Account and IAM User

1. **Sign up for AWS** at https://aws.amazon.com if you don't have an account
2. **Log into AWS Console** and search for "IAM" in the services menu
3. **Create a new IAM user:**
   - Click "Users" → "Add users"
   - Username: `monet-s3-user`
   - Select "Programmatic access" (not console access)
   - Click "Next: Permissions"

4. **Set permissions:**
   - Click "Attach existing policies directly"
   - Search for "AmazonS3FullAccess" and check it
   - Click "Next: Tags" → "Next: Review" → "Create user"

5. **Save credentials:**
   - **IMPORTANT**: Copy your `Access Key ID` and `Secret Access Key`
   - Store them securely - you won't see the secret key again!

#### Step 2: Create S3 Bucket

1. **Navigate to S3** in the AWS Console
2. **Click "Create bucket"**
3. **Configure bucket:**
   - Bucket name: `monet-file-uploads-dev` (must be globally unique)
   - Region: `us-east-1` (or your preferred region)
   - Leave other settings as default
   - Click "Create bucket"

#### Step 3: Configure Bucket CORS Policy

1. **Open your bucket** and click the "Permissions" tab
2. **Scroll to "Cross-origin resource sharing (CORS)"**
3. **Click "Edit" and paste this configuration:**

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

4. **Click "Save changes"**

#### Step 4: Set Bucket Policy for Public Read Access

1. **In the same "Permissions" tab, scroll to "Bucket policy"**
2. **Click "Edit" and paste this policy** (replace `monet-file-uploads-dev` with your bucket name):

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

3. **Click "Save changes"**

#### Step 5: Update Environment Variables

Add your AWS credentials to `.env.local`:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA... # Your Access Key ID from Step 1
AWS_SECRET_ACCESS_KEY=... # Your Secret Access Key from Step 1
AWS_S3_BUCKET_NAME=monet-file-uploads-dev # Your bucket name from Step 2
```

#### Step 6: Test File Upload

1. **Start your development server:** `npm run dev`
2. **Go to** http://localhost:3000/auth/signup
3. **Choose "Professional" and upload a resume**
4. **Check your S3 bucket** - you should see the uploaded file!

### 4. Database Setup

The application will automatically connect to MongoDB Atlas. Models are defined in `src/lib/models/`:

- **User**: Candidates and professionals with extended signup fields
- **Session**: Booking and meeting details
- **Feedback**: Professional feedback and candidate ratings
- **Offer**: Job offer tracking for bonuses
- **ReferralEdge**: Multi-level referral payouts

### 5. Stripe Setup

1. Create a Stripe Connect platform account
2. Configure webhooks pointing to `/api/webhooks/stripe`
3. Add webhook events: `payment_intent.succeeded`, `transfer.created`, etc.

### 6. Run Development Server

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
│   │   └── webhooks/           # Stripe webhook handlers
│   ├── auth/                   # Authentication pages
│   │   ├── signup/             # Multi-step signup flows
│   │   │   ├── candidate/      # 3-step candidate onboarding
│   │   │   └── professional/   # 3-step professional onboarding
│   │   └── signin/             # Sign-in page
│   ├── components/             # React components
│   │   ├── ProDashboard.tsx    # Professional dashboard
│   │   ├── CandidateSearch.tsx # Professional search & booking
│   │   └── EnhancedDashboards/ # Phase 6 dashboard components
│   ├── candidate/              # Candidate pages
│   ├── professional/           # Professional pages
│   ├── about/                  # About page
│   ├── how-it-works/           # How it works page
│   └── globals.css             # Tailwind styles + animations
├── lib/
│   ├── models/                 # Mongoose schemas
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Database connection
│   ├── upload.ts               # S3 file upload utilities
│   └── utils.ts                # Helper functions
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

## 🔧 New Features (Phases 5-6)

### Phase 5: Advanced Signup Flows

#### Role Selection System
- **Smart role picker** with visual indicators and benefit tags
- **Candidate vs Professional** paths with different requirements
- **Physics-based animations** throughout signup process

#### Candidate Signup (3 Steps)
**Step 1: Academic Verification**
- School email verification (`.edu` domain validation)
- LinkedIn profile integration for auto-population
- Resume upload with drag-and-drop interface

**Step 2: Profile Completion**
- Profile picture upload with live preview
- Academic details (school, major, minor, GPA, clubs)
- Auto-populated from LinkedIn data

**Step 3: Offer Bonus Pledge**
- Customizable offer bonus ($100-$1,000 range)
- Complete explanation of offer bonus system
- Optional payment method setup (skippable)

#### Professional Signup (3 Steps)
**Step 1: Professional Verification**
- Work email verification with company domain checking
- LinkedIn profile integration
- Resume/CV upload

**Step 2: Professional Profile**
- Industry-specific profile fields
- Session rate configuration ($10-$500 range)
- Professional bio and expertise areas
- Profile picture upload

**Step 3: Earnings Setup**
- Stripe Connect onboarding integration
- Banking information setup (optional)
- Earnings projection calculator

### Phase 6: Enhanced Dashboards

#### Professional Dashboard Updates
- **Split-pane layout** with upcoming chats and inbound requests
- **Referral tracking** - separate sections for candidate referrals vs professional referrals
- **Enhanced earnings tracking** - session fees vs referral/offer bonuses
- **Feedback management** - pending submissions vs completed feedback
- **Real-time notifications** for new session requests

#### Candidate Dashboard Updates
- **Upcoming sessions** with join buttons and professional details
- **Enhanced mentor search** with advanced filtering
- **Professional profile popups** with detailed information
- **Request to chat** functionality with time slot selection
- **Session history** with feedback received

## 🛠️ Core APIs

### Authentication & Signup
- `POST /api/candidate/signup` - Complete candidate registration
- `POST /api/professional/onboard` - Professional account creation
- `GET /api/auth/[...nextauth]` - NextAuth.js authentication

### File Upload System
- `POST /api/upload` - Generate S3 presigned URLs for secure file uploads
- `DELETE /api/upload` - Delete files from S3 (cleanup)

### Session Management
- `POST /api/sessions/book` - Create session & payment intent
- `POST /api/sessions/[id]/confirm` - Professional accepts/declines
- `GET /api/sessions/professional/[id]` - Get professional's sessions

### Feedback & Payouts
- `POST /api/feedback/professional` - Submit feedback & trigger payouts
- Automatic referral chain calculation and Stripe transfers

### Professional Services
- `GET /api/professional/search` - Search available professionals
- `GET /api/professional/[id]` - Get professional details

### Offer Tracking
- `POST /api/offers` - Report job offer
- `PUT /api/offers` - Accept offer & trigger bonus payout

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

## 🎨 Design System

### Physics-Based Animations
- **Spring effects** on primary actions with cubic-bezier bounce
- **Gravity transitions** for navigation and form changes
- **Smooth progress bars** with momentum-based easing
- **Interactive hover states** with scale and shadow effects

### Visual Hierarchy
- **Minimalistic design** with consistent spacing and typography
- **Color-coded sections** for different user types and actions
- **Progressive disclosure** in signup flows and dashboards
- **Responsive design** optimized for mobile and desktop

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build production
npm run build

# Start production server
npm run start
```

## 📊 Production Deployment

### Vercel Frontend Deployment
1. **Connect GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard:
   ```
   MONGODB_URI=mongodb+srv://...
   STRIPE_SECRET_KEY=sk_live_...
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET_NAME=monet-file-uploads-prod
   NEXTAUTH_URL=https://your-domain.com
   ```
3. **Deploy automatically** on git push

### AWS S3 Production Setup
1. **Create production bucket:** `monet-file-uploads-prod`
2. **Update CORS policy** to allow your production domain:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["https://your-domain.com"],
       "ExposeHeaders": []
     }
   ]
   ```
3. **Create dedicated IAM user** with minimal S3 permissions
4. **Optional: Set up CloudFront CDN** for faster file delivery

### Database Production
- **MongoDB Atlas** automatically scales
- **Connection pooling** configured in `src/lib/db.ts`
- **Indexes** optimized for common queries

### Security Checklist
- ✅ **Presigned URLs** expire in 5 minutes
- ✅ **File type validation** on client and server
- ✅ **Rate limiting** on API endpoints
- ✅ **Input sanitization** with Mongoose schemas
- ✅ **Environment variables** secured in Vercel
- ✅ **Webhook signature verification** for Stripe

## 🔒 Security Considerations

- **Payment Security**: All payments processed through Stripe
- **Data Protection**: MongoDB Atlas with encryption at rest
- **Authentication**: OAuth-only, no password storage
- **File Security**: S3 presigned URLs with expiration
- **API Security**: Input validation with Zod schemas
- **Webhook Security**: Stripe signature verification

## 📈 Scaling Considerations

- **Serverless Architecture**: Auto-scales with Vercel Functions
- **Database**: MongoDB Atlas with automatic scaling
- **File Storage**: AWS S3 with unlimited capacity
- **CDN**: Vercel Edge Network + optional CloudFront
- **Monitoring**: Sentry alerts for error rates and performance

## 🆘 Troubleshooting

### Common AWS S3 Issues

**Problem**: "Access Denied" when uploading files
**Solution**: Check your IAM user permissions and bucket policy

**Problem**: CORS errors in browser console
**Solution**: Verify CORS policy includes your domain (localhost:3000 for dev)

**Problem**: Files upload but can't be viewed
**Solution**: Ensure bucket policy allows public read access

### Common Development Issues

**Problem**: Environment variables not loading
**Solution**: Restart your development server after changing `.env.local`

**Problem**: Database connection errors
**Solution**: Check MongoDB Atlas connection string and IP whitelist

**Problem**: Stripe webhooks failing
**Solution**: Verify webhook secret and endpoint URL in Stripe dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [AWS S3 Developer Guide](https://docs.aws.amazon.com/s3/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

**Built with ❤️ for the future of professional networking**

## 📋 Quick Reference Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# AWS S3 Commands
aws s3 ls               # List your S3 buckets
aws s3 cp file.pdf s3://your-bucket/  # Upload file to S3
aws s3 sync ./uploads s3://your-bucket/uploads/  # Sync folder

# Database
mongosh "mongodb+srv://..."  # Connect to MongoDB Atlas
```