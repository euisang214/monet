'use client';

export default function TestModeIndicator() {
  // Only show in development with test keys
  const isTestMode = process.env.NODE_ENV === 'development' || 
                     process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('pk_test_');

  if (!isTestMode) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm font-semibold z-50">
        🧪 TEST MODE - Use test cards: 4242 4242 4242 4242
      </div>
      <div className="h-10" />
    </>
  );
}