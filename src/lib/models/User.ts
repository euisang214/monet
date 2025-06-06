import mongoose, { Schema, Document } from "mongoose";

/**
 * User account representing a candidate or professional.
 */
export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  role: "candidate" | "professional";
  profileImageUrl?: string;
  googleCalendarToken?: string;
  
  // Verification fields
  schoolEmail?: string;
  schoolEmailVerified?: boolean;
  workEmail?: string;
  workEmailVerified?: boolean;
  linkedinUrl?: string;
  resumeUrl?: string;
  
  // Candidate fields
  targetRole?: string;
  targetIndustry?: string;
  offerBonusCents?: number;
  school?: string;
  major?: string;
  minor?: string;
  graduationYear?: string;
  clubs?: string;
  gpa?: string;
  
  // Professional fields
  title?: string;
  company?: string;
  industry?: string;
  yearsExperience?: number;
  bio?: string;
  expertise?: string[];
  sessionRateCents?: number;
  stripeAccountId?: string;
  stripeAccountVerified?: boolean;
  referredBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["candidate", "professional"],
      default: "candidate",
    },
    profileImageUrl: { type: String, trim: true },
    googleCalendarToken: { type: String, trim: true },
    
    // Verification fields
    schoolEmail: { type: String, trim: true },
    schoolEmailVerified: { type: Boolean, default: false },
    workEmail: { type: String, trim: true },
    workEmailVerified: { type: Boolean, default: false },
    linkedinUrl: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },
    
    // Candidate fields
    targetRole: { type: String, trim: true },
    targetIndustry: { type: String, trim: true },
    offerBonusCents: { type: Number, min: 0 },
    school: { type: String, trim: true },
    major: { type: String, trim: true },
    minor: { type: String, trim: true },
    clubs: { type: String, trim: true },
    gpa: { type: String, trim: true },
    
    // Professional fields
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    industry: { type: String, trim: true },
    yearsExperience: { type: Number, min: 0 },
    bio: { type: String, trim: true },
    expertise: [{ type: String, trim: true }],
    sessionRateCents: { type: Number, min: 0 },
    stripeAccountId: { type: String, trim: true },
    stripeAccountVerified: { type: Boolean, default: false },
    referredBy: { type: String, ref: "User" },
  },
  { timestamps: true },
);

// Indexes for common queries
UserSchema.index({ role: 1 });
UserSchema.index(
  { email: 1 },
  { unique: true, background: true, collation: { locale: 'en', strength: 2 } }
);
UserSchema.index(
  { schoolEmail: 1 },
  { unique: true, background: true, collation: { locale: 'en', strength: 2 } }
);
UserSchema.index(
  { workEmail: 1 },
  { unique: true, background: true, collation: { locale: 'en', strength: 2 } }
);
UserSchema.index({ company: 1, role: 1 });

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;