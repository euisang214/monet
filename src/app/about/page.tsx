import Link from "next/link";
import Navigation from "@/components/ui/Navigation";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navigation variant="public" currentPage="about" />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Building the Networks That Build Careers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Monet helps candidates from all backgrounds connect with professionals, gain insider insights, and unlock opportunities that traditional pathways often miss.
          </p>
        </div>

        {/* Our Mission */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Traditional networking in finance and consulting is broken. Candidates without built-in networks — often from non-target schools — face glass ceilings. Meanwhile, professionals are overwhelmed by unstructured outreach and lack scalable ways to help.
            </p>
            <p>
              Monet bridges this gap by creating a trusted platform where talent meets opportunity through motivated, high-quality connections.
            </p>
          </div>
        </div>

        {/* The Problem We&apos;re Solving */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">The Problem We&apos;re Solving</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Limited access</h3>
                  <p className="text-gray-600">Candidates without alumni or personal connections struggle to reach industry professionals.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Opaque hiring funnels</h3>
                  <p className="text-gray-600">Applications often disappear into automated systems or are never seen by decision-makers.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Professional overload</h3>
                  <p className="text-gray-600">Professionals receive countless informal outreach requests but lack a clear structure or incentive to engage.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Missed talent</h3>
                  <p className="text-gray-600">Companies overlook exceptional candidates buried in large, generic applicant pools.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How Monet Works */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How Monet Works</h2>
          
          {/* Flowchart */}
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="bg-indigo-50 rounded-lg p-6 flex-1 max-w-sm">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold mb-3">1</div>
                <p className="text-gray-700">Book paid 1:1 coffee chats with professionals in investment banking and consulting.</p>
              </div>
              <div className="hidden md:block text-indigo-400">→</div>
              <div className="bg-green-50 rounded-lg p-6 flex-1 max-w-sm">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mb-3">2</div>
                <p className="text-gray-700">Gain actionable insights — from interview preparation to firm-specific culture and expectations.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="bg-purple-50 rounded-lg p-6 flex-1 max-w-sm">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mb-3">3</div>
                <p className="text-gray-700">Receive structured feedback after each session to sharpen your profile and performance.</p>
              </div>
              <div className="hidden md:block text-purple-400">→</div>
              <div className="bg-blue-50 rounded-lg p-6 flex-1 max-w-sm">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3">4</div>
                <p className="text-gray-700">Tap into a powerful referral network — professionals can refer you internally, expanding access to roles that often aren&apos;t posted publicly.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">For professionals:</h3>
            <p className="text-gray-700">monetize your time, help elevate promising talent, and grow your own network.</p>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              We created Monet because we experienced firsthand how challenging it is to break into competitive industries without the right network. Only a few years ago, we were candidates navigating internship and full-time recruiting ourselves — and we saw how a single conversation with the right person could change everything.
            </p>
            <p>
              Now, as professionals on the other side of the table, we&apos;ve seen the inefficiencies from both angles: unstructured outreach, overwhelmed professionals, and missed opportunities on all sides.
            </p>
            <p>
              Monet is our solution — a platform designed to make career-building conversations more accessible, more effective, and more rewarding for everyone involved.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Ready to unlock your next opportunity?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/candidate/search"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Book Your First Chat →
            </Link>
            <Link 
              href="/auth/signup"
              className="text-indigo-600 hover:text-indigo-800 px-8 py-3 text-lg font-semibold underline transition-colors"
            >
              Professionals: Join as a mentor →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 Monet. Built with Next.js, MongoDB, and Stripe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}