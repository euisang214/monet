import Link from "next/link";
import ProfessionalOnboarding from '@/app/components/ProfessionalOnboarding';

export default function ProfessionalOnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-indigo-600">
                    Monet
                </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Join as a Professional Mentor
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Share your expertise, help candidates succeed, and earn money doing what you love. 
            Complete the onboarding process to start accepting sessions.
          </p>
        </div>
        
        <ProfessionalOnboarding />
      </div>
    </div>
  );
}