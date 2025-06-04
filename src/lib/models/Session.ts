import mongoose, { Schema, Document } from "mongoose";

/**
 * Session booked between a candidate and a professional.
 */
export interface ISession extends Document {
  _id: string;
  candidateId: string;
  professionalId: string;
  firmId: string;
  referrerProId?: string;
  scheduledAt: Date;
  durationMinutes: number;
  rateCents: number;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  requestMessage?: string;
  cancelReason?: string;
  zoomJoinUrl?: string;
  zoomMeetingId?: string;
  googleCalendarEventId?: string;
  stripePaymentIntentId?: string;
  stripeTransferIds?: string[];
  paidAt?: Date;
  completedAt?: Date;
  feedbackSubmittedAt?: Date;
  isFirstChatAtFirm?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    candidateId: { type: String, ref: "User", required: true },
    professionalId: { type: String, ref: "User", required: true },
    firmId: { type: String, required: true, trim: true },
    referrerProId: { type: String, ref: "User" },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30, min: 1 },
    rateCents: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested",
    },
    requestMessage: { type: String, trim: true, maxlength: 500 },
    cancelReason: { type: String, trim: true },
    zoomJoinUrl: { type: String, trim: true },
    zoomMeetingId: { type: String, trim: true },
    googleCalendarEventId: { type: String, trim: true },
    stripePaymentIntentId: { type: String, trim: true },
    stripeTransferIds: [{ type: String, trim: true }],
    paidAt: Date,
    completedAt: Date,
    feedbackSubmittedAt: Date,
    isFirstChatAtFirm: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Indexes for lookups
SessionSchema.index({ professionalId: 1, scheduledAt: -1 });
SessionSchema.index({ candidateId: 1, scheduledAt: -1 });
SessionSchema.index({ firmId: 1 });

const Session =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
