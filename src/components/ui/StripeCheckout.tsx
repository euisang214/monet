'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiRequest, formatCurrencyDisplay } from '@/lib/utils';

interface Professional {
  _id: string;
  name: string;
  title: string;
  company: string;
  sessionRateCents: number;
  expertise: string[];
  bio: string;
}

interface SessionSuccessData {
  sessionId: string;
  scheduledAt: Date | null;
  professional: {
    name: string;
    title: string;
    company: string;
  };
  zoomJoinUrl?: string;
}

interface StripeCheckoutProps {
  professional: Professional;
  availability: Array<{ start: Date; end: Date }>;
  onSuccess: (sessionData: SessionSuccessData) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

interface BookingFormData {
  durationMinutes: number;
  requestMessage: string;
}

export default function StripeCheckout({
  professional,
  availability,
  onSuccess,
  onCancel,
  onError
}: StripeCheckoutProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'processing'>('details');
  const [bookingData, setBookingData] = useState<BookingFormData>({
    durationMinutes: 30,
    requestMessage: ''
  });

  const handleBookingSubmit = async () => {
    if (!session?.user?.id || availability.length === 0) {
      onError('Please sign in and select availability');
      return;
    }

    if (!bookingData.requestMessage.trim()) {
      onError('Please include a message about what you\'d like to discuss');
      return;
    }

    setStep('processing');
    setLoading(true);

    try {
      // Create session and get payment intent
      const result = await apiRequest<{ sessionId: string }>(
        '/api/sessions/book', {
          method: 'POST',
          body: JSON.stringify({
            candidateId: session.user.id,
            professionalId: professional._id,
            candidateAvailability: availability.map(a => ({ start: a.start.toISOString(), end: a.end.toISOString() })),
            durationMinutes: bookingData.durationMinutes,
            requestMessage: bookingData.requestMessage.trim()
          })
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create session');
      }

      const { sessionId } = result.data!;

      // Redirect to Stripe Checkout
      // In a production environment, you'd use Stripe's official Checkout
      // For now, we'll simulate the payment process
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, payment confirmation would be handled by Stripe webhooks
      onSuccess({
        sessionId,
        scheduledAt: null,
        professional: {
          name: professional.name,
          title: professional.title,
          company: professional.company
        }
      });

    } catch (error) {
      console.error('Booking error:', error);
      onError(error instanceof Error ? error.message : 'Failed to book session');
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const handleDateTimeChange = (field: keyof BookingFormData, value: string | number) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (step === 'processing') {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
        <p className="text-gray-600 mb-4">
          Creating your session and setting up the meeting...
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <div className="text-blue-900 text-sm">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Creating Zoom meeting</span>
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Adding to Google Calendar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Sending confirmation emails</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {professional.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{professional.name}</h3>
            <p className="text-gray-600">{professional.title} at {professional.company}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Selected Slots:</span>
            <div className="font-medium">{availability.length}</div>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <div className="font-medium">{bookingData.durationMinutes} minutes</div>
          </div>
          <div>
            <span className="text-gray-500">Session Fee:</span>
            <div className="font-bold text-indigo-600 text-lg">
              {formatCurrencyDisplay(professional.sessionRateCents)}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to discuss? *
          </label>
          <textarea
            value={bookingData.requestMessage}
            onChange={(e) => handleDateTimeChange('requestMessage', e.target.value)}
            placeholder="Hi [Professional Name], I'm interested in learning about... I'd appreciate your insights on... I'm preparing for..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={4}
            maxLength={500}
          />
          <div className="mt-1 text-xs text-gray-500">
            {bookingData.requestMessage.length}/500 characters
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Duration
          </label>
          <select
            value={bookingData.durationMinutes}
            onChange={(e) => handleDateTimeChange('durationMinutes', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={30}>30 minutes (Standard)</option>
            <option value={45}>45 minutes (+50% fee)</option>
            <option value={60}>60 minutes (+100% fee)</option>
          </select>
          {bookingData.durationMinutes > 30 && (
            <div className="mt-1 text-sm text-gray-600">
              Extended session fee: {formatCurrencyDisplay(
                Math.round(professional.sessionRateCents * (bookingData.durationMinutes / 30))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-semibold text-indigo-900 mb-3">What happens next:</h4>
        <ul className="text-sm text-indigo-800 space-y-2">
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Payment processed securely via Stripe</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Professional receives notification and has 24 hours to confirm</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Zoom meeting created and calendar invites sent</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-green-500 mt-0.5">✓</span>
            <span>Written feedback provided after the session</span>
          </li>
        </ul>
      </div>

      {/* Booking Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Cancel
        </button>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="text-xl font-bold text-gray-900">
              {formatCurrencyDisplay(
                Math.round(professional.sessionRateCents * (bookingData.durationMinutes / 30))
              )}
            </div>
          </div>
          
          <button
            onClick={handleBookingSubmit}
            disabled={loading || !bookingData.requestMessage.trim() || availability.length === 0}
            className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? 'Processing...' : 'Book Session'}
          </button>
        </div>
      </div>

      {/* Test Mode Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <div className="text-blue-600 mt-0.5">🧪</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Test Mode Active</h4>
            <p className="text-sm text-blue-800 mb-2">
              Use these test card numbers for development:
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Success:</strong> 4242 4242 4242 4242</div>
              <div><strong>Decline:</strong> 4000 0000 0000 0002</div>
              <div><strong>3D Secure:</strong> 4000 0000 0000 3220</div>
              <div>Expiry: Any future date | CVC: Any 3 digits</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}