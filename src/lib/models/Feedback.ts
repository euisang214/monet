import mongoose, { Schema, Document } from 'mongoose';

// Professional feedback to candidate
export interface IProfessionalFeedback extends Document {
  _id: string;
  sessionId: string;
  professionalId: string;
  candidateId: string;
  
  // Structured ratings (1-5)
  culturalFitRating: number;
  interestRating: number;
  technicalRating: number;
  
  // Written feedback
  feedback: string;
  
  // Internal notes (not shown to candidate)
  internalNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const ProfessionalFeedbackSchema = new Schema<IProfessionalFeedback>({
  sessionId: {
    type: String,
    ref: 'Session',
    required: true,
    unique: true // One feedback per session - this creates the index automatically
  },
  professionalId: {
    type: String,
    ref: 'User',
    required: true
  },
  candidateId: {
    type: String,
    ref: 'User',
    required: true
  },
  
  // Structured ratings
  culturalFitRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  interestRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  technicalRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Written feedback
  feedback: {
    type: String,
    required: true,
    trim: true,
    minlength: 20, // Minimum 20 chars as per spec
    maxlength: 500
  },
  
  // Internal notes
  internalNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Additional indexes (not duplicating the unique sessionId index)
ProfessionalFeedbackSchema.index({ professionalId: 1, createdAt: -1 });
ProfessionalFeedbackSchema.index({ candidateId: 1, createdAt: -1 });

// Candidate rating of professional
export interface ICandidateRating extends Document {
  _id: string;
  sessionId: string;
  candidateId: string;
  professionalId: string;
  
  // Overall rating (1-5 stars)
  rating: number;
  
  // Optional written review
  review?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const CandidateRatingSchema = new Schema<ICandidateRating>({
  sessionId: {
    type: String,
    ref: 'Session',
    required: true,
    unique: true // One rating per session - this creates the index automatically
  },
  candidateId: {
    type: String,
    ref: 'User',
    required: true
  },
  professionalId: {
    type: String,
    ref: 'User',
    required: true
  },
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  review: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Additional indexes (not duplicating the unique sessionId index)
CandidateRatingSchema.index({ professionalId: 1, rating: 1 });
CandidateRatingSchema.index({ candidateId: 1, createdAt: -1 });

// Referral tracking for multi-level payouts
export interface IReferralEdge extends Document {
  _id: string;
  sessionId: string;
  referrerProId: string;
  level: number; // 1 = direct referrer, 2 = referrer's referrer, etc.
  bonusCents: number;
  stripeTransferId?: string;
  paidAt?: Date;
  
  createdAt: Date;
}

const ReferralEdgeSchema = new Schema<IReferralEdge>({
  sessionId: {
    type: String,
    ref: 'Session',
    required: true
  },
  referrerProId: {
    type: String,
    ref: 'User',
    required: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // Cap at 10 levels as per spec
  },
  bonusCents: {
    type: Number,
    required: true,
    min: 0
  },
  stripeTransferId: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for referral queries
ReferralEdgeSchema.index({ sessionId: 1, level: 1 });
ReferralEdgeSchema.index({ referrerProId: 1, createdAt: -1 });
ReferralEdgeSchema.index({ stripeTransferId: 1 });

// Offer bonus tracking
export interface IOffer extends Document {
  _id: string;
  candidateId: string;
  firmId: string;
  firstChatProId?: string; // Professional who had the first chat at this firm
  
  // Offer details
  position: string;
  salaryCents?: number;
  equity?: string;
  
  // Status tracking
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedAt?: Date;
  
  // Bonus payout tracking
  bonusCents: number; // From candidate's offerBonusCents at time of first chat
  bonusPaidAt?: Date;
  stripeTransferId?: string;
  
  // Metadata
  reportedBy: string; // userId who reported this offer
  confirmedBy?: string; // candidate confirmation if reported by pro
  
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>({
  candidateId: {
    type: String,
    ref: 'User',
    required: true
  },
  firmId: {
    type: String,
    required: true,
    trim: true
  },
  firstChatProId: {
    type: String,
    ref: 'User'
  },
  
  // Offer details
  position: {
    type: String,
    required: true,
    trim: true
  },
  salaryCents: {
    type: Number,
    min: 0
  },
  equity: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date
  },
  
  // Bonus tracking
  bonusCents: {
    type: Number,
    required: true,
    min: 0
  },
  bonusPaidAt: {
    type: Date
  },
  stripeTransferId: {
    type: String,
    trim: true
  },
  
  // Metadata
  reportedBy: {
    type: String,
    ref: 'User',
    required: true
  },
  confirmedBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
OfferSchema.index({ candidateId: 1, status: 1 });
OfferSchema.index({ firmId: 1, status: 1 });
OfferSchema.index({ firstChatProId: 1, status: 1 });

export const ProfessionalFeedback = mongoose.models.ProfessionalFeedback || 
  mongoose.model<IProfessionalFeedback>('ProfessionalFeedback', ProfessionalFeedbackSchema);

export const CandidateRating = mongoose.models.CandidateRating || 
  mongoose.model<ICandidateRating>('CandidateRating', CandidateRatingSchema);

export const ReferralEdge = mongoose.models.ReferralEdge || 
  mongoose.model<IReferralEdge>('ReferralEdge', ReferralEdgeSchema);

export const Offer = mongoose.models.Offer || 
  mongoose.model<IOffer>('Offer', OfferSchema);