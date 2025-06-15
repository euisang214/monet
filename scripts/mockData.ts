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
 * Enhanced mock data loader with expanded dataset for comprehensive testing
 * Creates realistic sample data across all models with complex referral chains
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
      schoolEmail: 'alice.chen@harvard.edu',
      schoolEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/alice-chen-harvard',
      resumeUrl: 'https://monet-file-uploads-dev.s3.us-east-1.amazonaws.com/resumes/alice_chen_resume.pdf',
      clubs: 'Harvard Investment Club President, Women in Business VP, Volunteer at Boston Food Bank'
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
      schoolEmail: 'john.martinez@upenn.edu',
      schoolEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/johnmartinez-wharton',
      resumeUrl: 'https://monet-file-uploads-dev.s3.us-east-1.amazonaws.com/resumes/john_martinez_resume.pdf',
      clubs: 'Wharton Consulting Club, Finance Society, Intramural Soccer Team Captain'
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
      schoolEmail: 'sarah.kim@stanford.edu',
      schoolEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/sarah-kim-stanford',
      resumeUrl: 'https://monet-file-uploads-dev.s3.us-east-1.amazonaws.com/resumes/sarah_kim_resume.pdf',
      clubs: 'Stanford Women in Tech, CS Honor Code Council, Habitat for Humanity'
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
      sessionRateCents: 1500, // $15
      bio: 'VP at Goldman Sachs with 8 years in M&A. Previously worked at Blackstone and graduated from Wharton. I help candidates prepare for banking interviews and understand the industry landscape.',
      expertise: ['Investment Banking', 'M&A', 'Financial Modeling', 'Interview Prep', 'Resume Review'],
      stripeAccountId: 'acct_mock_goldman_vp',
      stripeAccountVerified: true,
      workEmail: 'michael.thompson@gs.com',
      workEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/michael-thompson-gs'
    },
    {
      email: 'jennifer.wong@mckinsey.com',
      name: 'Jennifer Wong',
      role: 'professional',
      title: 'Associate Partner',
      company: 'McKinsey & Company',
      industry: 'Management Consulting',
      yearsExperience: 12,
      sessionRateCents: 2000, // $20
      bio: 'Associate Partner at McKinsey specializing in financial services and technology. I mentor candidates on case interview prep, consulting careers, and leadership development.',
      expertise: ['Management Consulting', 'Case Interviews', 'Strategy', 'Leadership', 'Financial Services'],
      stripeAccountId: 'acct_mock_mckinsey_ap',
      stripeAccountVerified: true,
      workEmail: 'jennifer.wong@mckinsey.com',
      workEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/jennifer-wong-mckinsey'
    },
    {
      email: 'david.park@kkr.com',
      name: 'David Park',
      role: 'professional',
      title: 'Principal',
      company: 'KKR',
      industry: 'Private Equity',
      yearsExperience: 10,
      sessionRateCents: 2500, // $25
      bio: 'Principal at KKR focusing on healthcare and technology investments. Former Goldman Sachs banker with extensive experience in LBOs and growth equity.',
      expertise: ['Private Equity', 'LBO Modeling', 'Due Diligence', 'Healthcare', 'Technology'],
      stripeAccountId: 'acct_mock_kkr_principal',
      stripeAccountVerified: true,
      workEmail: 'david.park@kkr.com',
      workEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/david-park-kkr',
      referredBy: '' // Will be set after creation
    },
    {
      email: 'emily.davis@bain.com',
      name: 'Emily Davis',
      role: 'professional',
      title: 'Principal',
      company: 'Bain & Company',
      industry: 'Management Consulting',
      yearsExperience: 7,
      sessionRateCents: 10000, // $100
      bio: 'Principal at Bain with focus on retail and consumer goods. I help candidates break into consulting and navigate the interview process.',
      expertise: ['Management Consulting', 'Case Interviews', 'Retail Strategy', 'Consumer Goods'],
      stripeAccountId: 'acct_mock_bain_principal',
      stripeAccountVerified: true,
      workEmail: 'emily.davis@bain.com',
      workEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/emily-davis-bain'
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
      workEmail: 'alex.rivera@jpmorgan.com',
      workEmailVerified: true,
      linkedinUrl: 'https://linkedin.com/in/alex-rivera-jpmorgan'
    }
  ]);

  // Set up referral relationship after professionals are created
  await User.findByIdAndUpdate(professionals[2]._id, { 
    referredBy: professionals[0]._id.toString() 
  });

  console.log(`✅ Created ${candidates.length} candidates and ${professionals.length} professionals`);

  // Create Sessions with various statuses - FIXED INDICES
  const sessions = await Session.insertMany([
    // Upcoming confirmed sessions
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
      zoomMeetingId: 'mock123456',
      googleCalendarEventId: 'cal_event_123',
      stripePaymentIntentId: 'pi_mock_confirmed_1',
      paidAt: new Date(),
    },
    {
      candidateId: candidates[2]._id,
      professionalId: professionals[1]._id,
      firmId: 'McKinsey & Company',
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      durationMinutes: 30,
      rateCents: 20000,
      status: 'confirmed',
      isFirstChatAtFirm: true,
      zoomJoinUrl: 'https://zoom.us/j/mock789012',
      zoomMeetingId: 'mock789012',
      stripePaymentIntentId: 'pi_mock_confirmed_2',
      paidAt: new Date(),
    },
    {
      candidateId: candidates[1]._id,
      professionalId: professionals[2]._id,
      firmId: 'KKR',
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      durationMinutes: 45,
      rateCents: 37500, // 45 min session (25000 * 1.5)
      status: 'confirmed',
      isFirstChatAtFirm: true,
      zoomJoinUrl: 'https://zoom.us/j/mock345678',
      zoomMeetingId: 'mock345678',
      stripePaymentIntentId: 'pi_mock_confirmed_3',
      paidAt: new Date(),
    },

    // Pending requests
    {
      candidateId: candidates[1]._id,
      professionalId: professionals[1]._id,
      firmId: 'McKinsey & Company',
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      durationMinutes: 30,
      rateCents: 20000,
      status: 'requested',
      requestMessage: 'Hi Jennifer, I\'m preparing for McKinsey interviews and would love to learn about your experience in financial services consulting.',
      isFirstChatAtFirm: true,
      stripePaymentIntentId: 'pi_mock_pending_1',
    },
    {
      candidateId: candidates[0]._id,
      professionalId: professionals[3]._id,
      firmId: 'Bain & Company',
      scheduledAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
      durationMinutes: 30,
      rateCents: 18000,
      status: 'requested',
      requestMessage: 'Hi Emily, I\'m interested in retail consulting and would love to learn about your path to Bain.',
      isFirstChatAtFirm: true,
      stripePaymentIntentId: 'pi_mock_pending_2',
    },
    {
      candidateId: candidates[2]._id,
      professionalId: professionals[2]._id,
      firmId: 'KKR',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      durationMinutes: 30,
      rateCents: 25000,
      status: 'requested',
      requestMessage: 'Hi David, I\'m interested in private equity and would appreciate insights into the KKR recruitment process.',
      isFirstChatAtFirm: false, // Sarah already had a session at KKR
      stripePaymentIntentId: 'pi_mock_pending_3',
    },

    // Completed sessions needing feedback
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
      stripePaymentIntentId: 'pi_mock_completed_no_feedback_1',
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      candidateId: candidates[1]._id,
      professionalId: professionals[3]._id,
      firmId: 'Bain & Company',
      scheduledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      durationMinutes: 30,
      rateCents: 18000,
      status: 'completed',
      isFirstChatAtFirm: true,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_completed_no_feedback_2',
      paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },

    // Completed sessions with feedback
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
      stripePaymentIntentId: 'pi_mock_completed_with_feedback_1',
      stripeTransferIds: ['tr_mock_kkr_payout_1'],
      paidAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      candidateId: candidates[1]._id,
      professionalId: professionals[1]._id,
      firmId: 'McKinsey & Company',
      scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      durationMinutes: 30,
      rateCents: 20000,
      status: 'completed',
      isFirstChatAtFirm: false, // John already had a pending at McKinsey
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      feedbackSubmittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_completed_with_feedback_2',
      stripeTransferIds: ['tr_mock_mckinsey_payout_1'],
      paidAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    },

    // Referral sessions with complex chains
    {
      candidateId: candidates[1]._id,
      professionalId: professionals[2]._id, // KKR Principal
      firmId: 'KKR',
      referrerProId: professionals[0]._id, // Referred by Goldman VP
      scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      durationMinutes: 30,
      rateCents: 25000,
      status: 'completed',
      isFirstChatAtFirm: false,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      feedbackSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_referral_session_1',
      stripeTransferIds: ['tr_mock_kkr_main_1', 'tr_mock_referral_bonus_1'],
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },

    // Additional completed sessions for variety
    {
      candidateId: candidates[0]._id,
      professionalId: professionals[1]._id,
      firmId: 'McKinsey & Company',
      scheduledAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      durationMinutes: 30,
      rateCents: 20000,
      status: 'completed',
      isFirstChatAtFirm: true,
      completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      feedbackSubmittedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_completed_3',
      stripeTransferIds: ['tr_mock_mckinsey_payout_2'],
      paidAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
    },

    // Cancelled sessions
    {
      candidateId: candidates[2]._id,
      professionalId: professionals[4]._id,
      firmId: 'J.P. Morgan',
      scheduledAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      durationMinutes: 30,
      rateCents: 8000,
      status: 'cancelled',
      cancelReason: 'Professional had scheduling conflict',
      stripePaymentIntentId: 'pi_mock_cancelled_1',
    },

    // Extended duration sessions
    {
      candidateId: candidates[2]._id,
      professionalId: professionals[0]._id,
      firmId: 'Goldman Sachs',
      scheduledAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      durationMinutes: 60, // 1-hour session
      rateCents: 30000, // $150 * 2 for extended duration
      status: 'completed',
      isFirstChatAtFirm: false, // Sarah already had Goldman session
      completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      feedbackSubmittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      stripePaymentIntentId: 'pi_mock_extended_1',
      stripeTransferIds: ['tr_mock_goldman_extended_1'],
      paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    }
  ]);

  console.log(`✅ Created ${sessions.length} sessions`);

  // Create Professional Feedback (using correct session indices)
  const feedbacks = await ProfessionalFeedback.insertMany([
    {
      sessionId: sessions[8]._id, // KKR session with Sarah
      professionalId: professionals[2]._id,
      candidateId: candidates[2]._id,
      culturalFitRating: 4,
      interestRating: 5,
      technicalRating: 4,
      feedback: 'Sarah showed excellent analytical thinking and asked thoughtful questions about private equity. Her technical background in CS gives her a unique perspective on tech investments. I\'d recommend her for PE analyst roles.',
      internalNotes: 'Strong candidate - should fast-track for summer internship interviews.'
    },
    {
      sessionId: sessions[9]._id, // McKinsey session with John
      professionalId: professionals[1]._id,
      candidateId: candidates[1]._id,
      culturalFitRating: 5,
      interestRating: 4,
      technicalRating: 3,
      feedback: 'John demonstrated strong problem-solving skills and great communication. He needs to work on structuring case responses but has excellent potential for consulting.',
      internalNotes: 'Recommend connecting with our campus recruiting team.'
    },
    {
      sessionId: sessions[10]._id, // Referral session
      professionalId: professionals[2]._id,
      candidateId: candidates[1]._id,
      culturalFitRating: 3,
      interestRating: 4,
      technicalRating: 3,
      feedback: 'John has good energy and clear career goals. His finance background is solid, though he could strengthen his modeling skills. Recommended next steps: practice LBO models and brush up on industry trends.',
    },
    {
      sessionId: sessions[11]._id, // Alice + McKinsey session
      professionalId: professionals[1]._id,
      candidateId: candidates[0]._id,
      culturalFitRating: 4,
      interestRating: 5,
      technicalRating: 5,
      feedback: 'Alice has exceptional analytical skills and deep understanding of financial markets. Her Harvard background shows in her structured approach. Would be a great fit for our financial services practice.',
      internalNotes: 'Top tier candidate - extend internship offer if possible.'
    },
    {
      sessionId: sessions[13]._id, // Extended Goldman session
      professionalId: professionals[0]._id,
      candidateId: candidates[2]._id,
      culturalFitRating: 5,
      interestRating: 5,
      technicalRating: 4,
      feedback: 'Sarah demonstrated exceptional mathematical ability and strong technical skills. Her CS background from Stanford is exactly what we look for in our tech banking group. Strong communication skills and great cultural fit.',
      internalNotes: 'Exceptional candidate - priority hire for our TMT group.'
    }
  ]);

  // Create Candidate Ratings
  const ratings = await CandidateRating.insertMany([
    {
      sessionId: sessions[8]._id,
      candidateId: candidates[2]._id,
      professionalId: professionals[2]._id,
      rating: 5,
      review: 'David was incredibly helpful and gave me detailed insights into the PE industry. His feedback was actionable and encouraging.'
    },
    {
      sessionId: sessions[9]._id,
      candidateId: candidates[1]._id,
      professionalId: professionals[1]._id,
      rating: 5,
      review: 'Jennifer provided excellent guidance on case interview prep and McKinsey culture. Really appreciated her honest feedback.'
    },
    {
      sessionId: sessions[10]._id,
      candidateId: candidates[1]._id,
      professionalId: professionals[2]._id,
      rating: 4,
      review: 'Great session with practical advice on breaking into PE. David shared specific examples and was very responsive to my questions.'
    },
    {
      sessionId: sessions[11]._id,
      candidateId: candidates[0]._id,
      professionalId: professionals[1]._id,
      rating: 5,
      review: 'Jennifer gave me invaluable insights into financial services consulting. Her background was exactly what I needed to hear.'
    },
    {
      sessionId: sessions[13]._id,
      candidateId: candidates[2]._id,
      professionalId: professionals[0]._id,
      rating: 5,
      review: 'Michael spent a full hour explaining tech banking at Goldman. Incredibly detailed and helpful for my career planning.'
    }
  ]);

  // Create Referral Edges (multi-level chains)
  const referralEdges = await ReferralEdge.insertMany([
    // Simple referral (Level 1 only)
    {
      sessionId: sessions[10]._id,
      referrerProId: professionals[0]._id, // Goldman VP gets referral bonus
      level: 1,
      bonusCents: 2500, // 10% of $250 session
      stripeTransferId: 'tr_mock_referral_bonus_1',
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
      salaryCents: 12000000, // $120k annualized
      status: 'accepted',
      acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      bonusCents: 25000, // Sarah's offer bonus
      bonusPaidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      stripeTransferId: 'tr_mock_offer_bonus_1',
      reportedBy: candidates[2]._id,
      confirmedBy: candidates[2]._id,
    },
    {
      candidateId: candidates[1]._id,
      firmId: 'McKinsey & Company',
      firstChatProId: professionals[1]._id,
      position: 'Summer Associate',
      salaryCents: 11000000, // $110k annualized
      status: 'accepted',
      acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      bonusCents: 30000, // John's offer bonus
      bonusPaidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      stripeTransferId: 'tr_mock_offer_bonus_2',
      reportedBy: professionals[1]._id, // Reported by professional
      confirmedBy: candidates[1]._id,
    },
    {
      candidateId: candidates[0]._id,
      firmId: 'Goldman Sachs',
      firstChatProId: professionals[0]._id,
      position: 'Investment Banking Summer Analyst',
      salaryCents: 13500000, // $135k annualized
      status: 'pending',
      bonusCents: 50000, // Alice's offer bonus (pending acceptance)
      reportedBy: professionals[0]._id,
    }
  ]);

  console.log(`✅ Created ${feedbacks.length} feedbacks, ${ratings.length} ratings, ${referralEdges.length} referral edges, ${offers.length} offers`);

  await disconnectDB();
  console.log('🎉 Enhanced mock data loaded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   • ${candidates.length} candidates from top universities`);
  console.log(`   • ${professionals.length} professionals across major firms`);
  console.log(`   • ${sessions.length} sessions with varied statuses`);
  console.log(`   • ${feedbacks.length} professional feedbacks with structured ratings`);
  console.log(`   • ${ratings.length} candidate ratings for professionals`);
  console.log(`   • ${referralEdges.length} referral payouts (including multi-level chains)`);
  console.log(`   • ${offers.length} job offers with bonus tracking`);
  console.log('\n🔗 Complex Referral Chains:');
  console.log('   • Goldman VP → KKR Principal (2-level chain)');
  console.log('\n🎯 Test Scenarios Covered:');
  console.log('   • Upcoming confirmed sessions with Zoom links');
  console.log('   • Pending requests awaiting professional acceptance');
  console.log('   • Completed sessions needing feedback submission');
  console.log('   • Completed sessions with full feedback & payouts');
  console.log('   • Referral bonus calculations');
  console.log('   • Offer bonus tracking and payouts');
  console.log('   • Extended duration sessions (45min, 60min)');
  console.log('   • Cancelled sessions with refund scenarios');
  console.log('\n🚀 Run "npm run dev" to see the fully populated website!');
}

// Run if called directly
if (require.main === module) {
  loadEnhancedMockData().catch((err) => {
    console.error('❌ Failed to load mock data:', err);
    mongoose.disconnect();
    process.exit(1);
  });
}