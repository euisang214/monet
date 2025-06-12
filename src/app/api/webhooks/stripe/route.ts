import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { connectDB } from '@/lib/models/db';
import Session from '@/lib/models/Session';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: unknown) {
      console.error('Webhook signature verification failed:', (err as Error).message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    await connectDB();

    console.log('Processing Stripe webhook event:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data.object as Stripe.Transfer);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment - confirm the session
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata.sessionId;
  
  if (!sessionId) {
    console.error('No sessionId in payment intent metadata');
    return;
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      console.error('Session not found for payment:', sessionId);
      return;
    }

    // Update session status to confirmed
    session.status = 'confirmed';
    session.paidAt = new Date();
    
    // TODO: Create Zoom meeting and Google Calendar events here
    // session.zoomJoinUrl = await createZoomMeeting(session);
    // session.googleCalendarEventId = await createCalendarEvent(session);

    await session.save();

    console.log('Session confirmed after payment:', sessionId);

    // TODO: Send confirmation emails to both parties
    // await sendSessionConfirmationEmail(session);

  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

/**
 * Handle failed payment - mark session as cancelled
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const sessionId = paymentIntent.metadata.sessionId;
  
  if (!sessionId) {
    console.error('No sessionId in payment intent metadata');
    return;
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      console.error('Session not found for failed payment:', sessionId);
      return;
    }

    session.status = 'cancelled';
    session.cancelReason = 'Payment failed';
    await session.save();

    console.log('Session cancelled due to payment failure:', sessionId);

  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Handle transfer creation - update payout tracking
 */
async function handleTransferCreated(transfer: Stripe.Transfer) {
  const sessionId = transfer.metadata.sessionId;
  const transferType = transfer.metadata.type;

  console.log(`Transfer created: ${transfer.id} for session ${sessionId} (${transferType})`);

  // For session fees, the payout status is already updated in the feedback API
  // For referral bonuses, the ReferralEdge records are already created
  // This webhook mainly serves as a confirmation/audit trail
}

/**
 * Handle transfer failure - needs manual intervention
 */
async function handleTransferFailed(transfer: Stripe.Transfer) {
  const sessionId = transfer.metadata.sessionId;
  const transferType = transfer.metadata.type;

  console.error(`Transfer failed: ${transfer.id} for session ${sessionId} (${transferType})`);

  // TODO: Implement retry logic or manual intervention workflow
  // For now, just log the failure for manual review
}

/**
 * Handle Stripe account updates (for professional onboarding)
 */
async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`Stripe account updated: ${account.id}, charges_enabled: ${account.charges_enabled}`);
  
  // TODO: Update professional's verification status in the database
  // This is useful for tracking when professionals complete KYC
}