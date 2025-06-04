import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/lib/models/db';
import User from '../src/lib/models/User';
import Session from '../src/lib/models/Session';
import { ProfessionalFeedback, CandidateRating, Offer } from '../src/lib/models/Feedback';

/**
 * Inserts sample records for local development if the database is empty.
 */
export async function loadMockData() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  await connectDB();

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    await disconnectDB();
    return;
  }

  const candidate = await User.create({
    email: 'candidate@example.com',
    name: 'Alice Candidate',
    role: 'candidate',
    offerBonusCents: 50000,
  });

  const professional = await User.create({
    email: 'pro@example.com',
    name: 'Bob Professional',
    role: 'professional',
    title: 'Software Engineer',
    company: 'TechCorp',
    sessionRateCents: 3000,
  });

  const session = await Session.create({
    candidateId: candidate._id.toString(),
    professionalId: professional._id.toString(),
    firmId: 'TechCorp',
    scheduledAt: new Date(Date.now() + 86400000),
    durationMinutes: 30,
    rateCents: 3000,
    status: 'confirmed',
    isFirstChatAtFirm: true,
  });

  await ProfessionalFeedback.create({
    sessionId: session._id.toString(),
    professionalId: professional._id.toString(),
    candidateId: candidate._id.toString(),
    culturalFitRating: 4,
    interestRating: 5,
    technicalRating: 4,
    feedback: 'Great potential. Keep improving your skills!',
  });

  await CandidateRating.create({
    sessionId: session._id.toString(),
    candidateId: candidate._id.toString(),
    professionalId: professional._id.toString(),
    rating: 5,
    review: 'Extremely helpful advice.',
  });

  await Offer.create({
    candidateId: candidate._id.toString(),
    firmId: 'TechCorp',
    firstChatProId: professional._id.toString(),
    position: 'Junior Engineer',
    bonusCents: candidate.offerBonusCents || 0,
    status: 'pending',
    reportedBy: candidate._id.toString(),
  });

  await disconnectDB();
}

loadMockData().catch((err) => {
  console.error('Failed to load mock data', err);
  mongoose.disconnect();
});