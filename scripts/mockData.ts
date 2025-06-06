import mongoose from 'mongoose';

// Load environment variables from .env.local so that `MONGODB_URI` and others
// are available when this script runs outside of Next.js
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB, disconnectDB } from '../src/lib/models/db';
import User from '../src/lib/models/User';
import Session from '../src/lib/models/Session';
import { ProfessionalFeedback, CandidateRating, Offer, ReferralEdge } from '../src/lib/models/Feedback';

/**
 * Enhanced mock data loader for development
 * Creates realistic sample data across all models
 */
export async function loadEnhancedMockData() {
  if (process.env.NODE_ENV === 'production') {
    console.log('❌ Mock data loading is disabled in production');
    return;
  }

  await connectDB();
  console.log('🔄 Loading enhanced mock data...');

  // Clear existing data in development
  await Promise.all([
    User.deleteMany({}),
    Session.deleteMany({}),
    ProfessionalFeedback.deleteMany({}),
    CandidateRating.deleteMany({}),
    Offer.deleteMany({}),
    ReferralEdge.deleteMany({})
  ]);

  console.log('🗑️ Cleared existing mock data');

  // Create Candidates
  const candidates = await User.insertMany([
    {
      email: 'alice.chen@harvard.edu',
      name: 'Alice Chen',
      role: 'candidate',
      profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b3ff?w=150&h=150&fit=crop&crop=face',
      school: 'Harvard University',
      major: 'Economics',
      minor: 'Computer Science',
      graduationYear: '2025',
      gpa: '3.8',
      targetRole: 'Investment Banking Analyst',
      targetIndustry: 'Investment Banking',
      offerBonusCents: 50000, // $500
    },
    {
      email: 'john.martinez@wharton.edu',
      name: 'John Martinez',
      role: 'candidate',
      school: 'University of Pennsylvania',
      major: 'Finance',
      graduationYear: '2024',
      targetRole: 'Management Consultant',
      targetIndustry: 'Management Consulting',
      offerBonusCents: 30000, // $300
    },
    {
      email: 'sarah.kim@stanford.edu',
      name: 'Sarah Kim',
      role: 'candidate',
      school: 'Stanford University',
      major: 'Computer Science',
      minor: 'Economics',
      graduationYear: '2025',
      targetRole: 'Software Engineer',
      targetIndustry: 'Technology',
      offerBonusCents: 25000, // $250
    }
  ]);

  // Create Professionals
  const professionals = await User.insertMany([
    {
      email: 'michael.thompson@goldmansachs.com',
      name: 'Michael Thompson',
      role: 'professional',
      title: 'Vice President',
      company: 'Goldman Sachs',
      industry: 'Investment Banking',
      yearsExperience: 8,
      sessionRateCents: 15000, // $150
      bio: 'VP at Goldman Sachs with 8 years in M&A. Previously worked at Blackstone and graduated from Wharton. I help candidates prepare for banking interviews and understand the industry landscape.',
      expertise: ['Investment Banking', 'M&A', 'Financial Modeling', 'Interview Prep', 'Resume Review'],
      stripeAccountId: 'acct_mock_goldman_vp',
      stripeAccountVerified: true,
    },
    {
      email: 'jennifer.wong@mckinsey.com',
      name: 'Jennifer Wong',
      role: 'professional',
      title: 'Associate Partner',
      company: 'McKinsey & Company',
      industry: 'Management Consulting',
      yearsExperience: 12,
      sessionRateCents: 20000, // $200
      bio: 'Associate Partner at McKinsey specializing in financial services and technology. I mentor candidates on case interview prep, consulting careers, and leadership development.',
      expertise: ['Management Consulting', 'Case Interviews', 'Strategy', 'Leadership', 'Financial Services'],
      stripeAccountId: 'acct_mock_mckinsey_ap',
      stripeAccountVerified: true,
    },
    {
      email: 'david.park@kkr.com',
      name: 'David Park',
      role: 'professional',
      title: 'Principal',
      company: 'KKR',
      industry: 'Private Equity',
      yearsExperience: 10,
      sessionRateCents: 25000, // $250
      bio: 'Principal at KKR focusing on healthcare and technology investments. Former Goldman Sachs banker with extensive experience in LBOs and growth equity.',
      expertise: ['Private Equity', 'LBO Modeling', 'Due Diligence', 'Healthcare', 'Technology'],
      stripeAccountId: 'acct_mock_kkr_principal',
      stripeAccountVerified: true,
      referredBy: professionals[0]?._id, // Referred by Goldman VP
    },
    {
      email: 'emily.davis@bain.com',
      name: 'Emily Davis',
      role: 'professional',
      title: 'Principal',
      company: 'Bain & Company',
      industry: 'Management Consulting',
      yearsExperience: 7,
      sessionRateCents: 18000, // $180
      bio: 'Principal at Bain with focus on retail and consumer goods. I help candidates break into consulting and navigate the interview process.',
      expertise: ['Management Consulting', 'Case Interviews', 'Retail Strategy', 'Consumer Goods'],
      stripeAccountId: 'acct_mock_bain_principal',
      stripeAccountVerified: true,
    },
    {
      email: 'alex.rivera@jpmorgan.com',
      name: 'Alex Rivera',
      role: 'professional',
      title: 'Associate',
      company: 'J.P. Morgan',
      industry: 'Investment Banking',
      yearsExperience: 3,
      sessionRateCents: 8000, // $80
      bio: 'Associate at JPM in the Technology, Media & Telecom group. Recent graduate who can share insights on analyst recruiting and early career development.',
      expertise: ['Investment Banking', 'TMT', 'Early Career', 'Analyst Recruiting'],
      stripeAccountId: 'acct_mock_jpmorgan_associate',
      stripeAccountVerified: true,
    }
  ]);

  console.log(`✅ Created ${candidates.length} candidates and ${professionals.length} professionals`);

  // Create Sessions with various statuses
  const sessions = await Session.insertMany([
    // Upcoming confirmed session
    {
      candidateId: candidates[0]._id,
      professionalId: professionals[0]._id,
      firmId: 'Goldman Sachs',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      durationMinutes: 30,
      rateCents: 15000,
      status: 'confirmed',
      isFirstChatAtFirm: true,
      zoomJoinUrl: 'https://zoom.us/j/mock123456',
      stripePaymentIntentId: 'pi_mock_confirmed',
      paidAt: new Date(),
    },
    // Pending request
    {
      candidateId: candidates[1]._id,
      professionalId: professionals[1]._id,
      firmId: 'McKinsey & Company',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      durationMinutes: 30,
      rateCents: 20000,
      status: 'requested',
      requestMessage: 'Hi Jennifer, I\'m preparing for McKinsey interviews and would love to learn about your experience in financial services consulting.',
      isFirstChatAtFirm: true,
      stripePaymentIntentId: 'pi_mock_pending',
    },
    // Completed session needing feedback
    {
      candidateId: candidates[0]._id,
      professionalId: professionals[4]._id,
      firmId: 'J.P. Morgan',
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      durationMinutes: 30,
      rateCents: 8000,
      status: 'completed',
      isFirstChatAtFirm: true,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_completed_no_feedback',
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    // Completed session with feedback
    {
      candidateId: candidates[2]._id,
      professionalId: professionals[2]._id,
      firmId: 'KKR',
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      durationMinutes: 30,
      rateCents: 25000,
      status: 'completed',
      isFirstChatAtFirm: true,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      feedbackSubmittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_completed_with_feedback',
      stripeTransferIds: ['tr_mock_kkr_payout'],
      paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    // Referral session
    {
      candidateId: candidates[1]._id,
      professionalId: professionals[2]._id,
      firmId: 'KKR',
      referrerProId: professionals[0]._id, // Referred by Goldman VP
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      durationMinutes: 30,
      rateCents: 25000,
      status: 'completed',
      isFirstChatAtFirm: false,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      feedbackSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_referral_session',
      stripeTransferIds: ['tr_mock_kkr_main', 'tr_mock_referral_bonus'],
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }
  ]);

  console.log(`✅ Created ${sessions.length} sessions`);

  // Create Professional Feedback
  const feedbacks = await ProfessionalFeedback.insertMany([
    {
      sessionId: sessions[3]._id, // KKR session with Sarah
      professionalId: professionals[2]._id,
      candidateId: candidates[2]._id,
      culturalFitRating: 4,
      interestRating: 5,
      technicalRating: 4,
      feedback: 'Sarah showed excellent analytical thinking and asked thoughtful questions about private equity. Her technical background in CS gives her a unique perspective on tech investments. I\'d recommend her for PE analyst roles.',
      internalNotes: 'Strong candidate - should fast-track for summer internship interviews.'
    },
    {
      sessionId: sessions[4]._id, // Referral session
      professionalId: professionals[2]._id,
      candidateId: candidates[1]._id,
      culturalFitRating: 3,
      interestRating: 4,
      technicalRating: 3,
      feedback: 'John has good energy and clear career goals. His finance background is solid, though he could strengthen his modeling skills. Recommended next steps: practice LBO models and brush up on industry trends.',
    }
  ]);

  // Create Candidate Ratings
  const ratings = await CandidateRating.insertMany([
    {
      sessionId: sessions[3]._id,
      candidateId: candidates[2]._id,
      professionalId: professionals[2]._id,
      rating: 5,
      review: 'David was incredibly helpful and gave me detailed insights into the PE industry. His feedback was actionable and encouraging.'
    },
    {
      sessionId: sessions[4]._id,
      candidateId: candidates[1]._id,
      professionalId: professionals[2]._id,
      rating: 4,
      review: 'Great session with practical advice on breaking into PE. David shared specific examples and was very responsive to my questions.'
    }
  ]);

  // Create Referral Edges (for the referral session)
  const referralEdges = await ReferralEdge.insertMany([
    {
      sessionId: sessions[4]._id,
      referrerProId: professionals[0]._id, // Goldman VP gets referral bonus
      level: 1,
      bonusCents: 2500, // 10% of $250 session
      stripeTransferId: 'tr_mock_referral_bonus',
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }
  ]);

  // Create Sample Offers
  const offers = await Offer.insertMany([
    {
      candidateId: candidates[2]._id,
      firmId: 'KKR',
      firstChatProId: professionals[2]._id,
      position: 'Private Equity Summer Intern',
      salaryCents: 12000000, // $120k
      status: 'accepted',
      acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      bonusCents: 25000, // Sarah's offer bonus
      bonusPaidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      stripeTransferId: 'tr_mock_offer_bonus',
      reportedBy: candidates[2]._id,
      confirmedBy: candidates[2]._id,
    }
  ]);

  console.log(`✅ Created ${feedbacks.length} feedbacks, ${ratings.length} ratings, ${referralEdges.length} referral edges, ${offers.length} offers`);

  await disconnectDB();
  console.log('🎉 Enhanced mock data loaded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • ${candidates.length} candidates (Alice, John, Sarah)`);
  console.log(`   • ${professionals.length} professionals (Goldman, McKinsey, KKR, Bain, JPM)`);
  console.log(`   • ${sessions.length} sessions (various statuses)`);
  console.log(`   • ${feedbacks.length} professional feedbacks`);
  console.log(`   • ${ratings.length} candidate ratings`);
  console.log(`   • ${referralEdges.length} referral payouts`);
  console.log(`   • ${offers.length} accepted offers`);
  console.log('\n🚀 Run "npm run dev" to see the populated website!');
}

// Run if called directly
if (require.main === module) {
  loadEnhancedMockData().catch((err) => {
    console.error('❌ Failed to load mock data:', err);
    mongoose.disconnect();
    process.exit(1);
  });
}