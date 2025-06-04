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
  // Candidate fields
  targetRole?: string;
  targetIndustry?: string;
  resumeUrl?: string;
  offerBonusCents?: number;
  // Professional fields
  title?: string;
  company?: string;
  industry?: string;
  yearsExperience?: number;
  bio?: string;
  expertise?: string[];
  sessionRateCents?: number;
  linkedinUrl?: string;
  stripeAccountId?: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["candidate", "professional"],
      default: "candidate",
    },
    profileImageUrl: { type: String, trim: true },
    googleCalendarToken: { type: String, trim: true },
    targetRole: { type: String, trim: true },
    targetIndustry: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },
    offerBonusCents: { type: Number, min: 0 },
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    industry: { type: String, trim: true },
    yearsExperience: { type: Number, min: 0 },
    bio: { type: String, trim: true },
    expertise: [{ type: String, trim: true }],
    sessionRateCents: { type: Number, min: 0 },
    linkedinUrl: { type: String, trim: true },
    stripeAccountId: { type: String, trim: true },
    referredBy: { type: String, ref: "User" },
  },
  { timestamps: true },
);

// Indexes for common queries
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
