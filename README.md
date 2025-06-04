# Monet - Candidate-to-Professional Platform

A serverless web application that connects job-seeking candidates with experienced professionals for paid virtual coffee chats. Built with Next.js, MongoDB Atlas, and Stripe Connect.

## 🎯 Business Model

- **Session Fees**: Candidates pay professionals for 30-minute video consultations
- **Offer Bonuses**: Professionals earn bonuses when candidates join their companies  
- **Referral Network**: Multi-level referral system pays ongoing commissions
- **Instant Payouts**: Professionals receive payments immediately after submitting feedback

## 🏗️ Architecture

- **Frontend/Backend**: Next.js 15 with App Router + TypeScript
- **Database**: MongoDB Atlas with Mongoose ODM
- **Payments**: Stripe Connect for split payouts and KYC
- **Authentication**: NextAuth.js with Google/LinkedIn OAuth
- **Infrastructure**: Vercel Functions (serverless)
- **Monitoring**: Sentry for error tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Stripe Connect account
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
```

### 3. Database Setup

The application will automatically connect to MongoDB Atlas. Models are defined in `src/lib/models/`:

- **User**: Candidates and professionals
- **Session**: Booking and meeting details
- **Feedback**: Professional feedback and candidate ratings
- **Offer**: Job offer tracking for bonuses
- **ReferralEdge**: Multi-level referral payouts

### 4. Stripe Setup

1. Create a Stripe Connect platform account
2. Configure webhooks pointing to `/api/webhooks/stripe`
3. Add webhook events: `payment_intent.succeeded`, `transfer.created`, etc.

### 5. Run Development Server

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
│   │   ├── professionals/      # Professional onboarding
│   │   └── webhooks/           # Stripe webhook handlers
│   ├── components/             # React components
│   │   ├── ProDashboard.tsx    # Professional dashboard
│   │   ├── CandidateSearch.tsx # Professional search & booking
│   │   └── ProfessionalOnboarding.tsx
│   ├── candidate/              # Candidate pages
│   ├── professional/           # Professional pages
│   └── globals.css             # Tailwind styles
├── lib/
│   ├── models/                 # Mongoose schemas
│   ├── auth.ts                 # NextAuth configuration
│   ├── db.ts                   # Database connection
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

## 🛠️ Core APIs

### Session Management
- `POST /api/sessions/book` - Create session & payment intent
- `POST /api/sessions/[id]/confirm` - Professional accepts/declines
- `GET /api/sessions/professional/[id]` - Get professional's sessions

### Feedback & Payouts
- `POST /api/feedback/professional` - Submit feedback & trigger payouts
- Automatic referral chain calculation and Stripe transfers

### Professional Onboarding
- `POST /api/professionals/onboard` - Complete profile & Stripe Connect
- `GET /api/professionals/search` - Search available professionals

### Offer Tracking
- `POST /api/offers` - Report job offer
- `PUT /api/offers` - Accept offer & trigger bonus payout

## 🔧 Key Features

### For Professionals
- **Dashboard**: View upcoming/completed sessions, earnings
- **Stripe Onboarding**: KYC and bank account setup
- **Instant Payouts**: Receive money immediately after feedback
- **Referral Earnings**: Build network and earn ongoing commissions

### For Candidates  
- **Professional Search**: Filter by industry, expertise, rate
- **Easy Booking**: Stripe Checkout integration
- **Calendar Sync**: Google Calendar integration (planned)
- **Feedback System**: Receive structured professional feedback

### Platform Features
- **Multi-level Referrals**: 10% → 1% → 0.1% commission structure
- **Offer Bonus Tracking**: First chat professional gets bonus
- **Webhook Processing**: Stripe event handling for reliability
- **Mobile Responsive**: Tailwind CSS for all screen sizes

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build production
npm run build

# Start production server
npm run start
```

## 📊 Monitoring & Analytics

- **Sentry**: Error tracking and performance monitoring
- **Stripe Dashboard**: Payment analytics and payout tracking
- **MongoDB Atlas**: Database performance metrics

## 🚢 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables in Production
Ensure all `.env.local` variables are set in your deployment platform.

## 🔒 Security Considerations

- **Payment Security**: All payments processed through Stripe
- **Data Protection**: MongoDB Atlas with encryption at rest
- **Authentication**: OAuth-only, no password storage
- **Webhook Security**: Stripe signature verification
- **Input Validation**: Zod schemas for API validation

## 📈 Scaling Considerations

- **Serverless Architecture**: Auto-scales with Vercel Functions
- **Database**: MongoDB Atlas with automatic scaling
- **CDN**: Vercel Edge Network for global performance
- **Monitoring**: Sentry alerts for error rates and performance

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
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

**Built with ❤️ for the future of professional networking**