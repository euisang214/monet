import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';

interface SignupCandidateRequest {
  // Step 1: Verification
  schoolEmail: string;
  linkedinUrl: string;
  resumeFile?: string; // Base64 or file URL after upload
  
  // Step 2: Profile
  name: string;
  school: string;
  major: string;
  minor?: string;
  clubs?: string;
  gpa?: string;
  profilePicture?: string; // Base64 or file URL after upload
  
  // Step 3: Offer Bonus
  offerBonusCents: number;
  paymentInfo?: string; // Optional payment method
}

/**
 * POST /api/candidate/signup
 * Complete candidate signup with Phase 5 data structure
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: SignupCandidateRequest = await request.json();
    const {
      schoolEmail,
      linkedinUrl,
      resumeFile,
      name,
      school,
      major,
      minor,
      clubs,
      gpa,
      profilePicture,
      offerBonusCents,
      paymentInfo
    } = body;

    // Validate required fields
    if (!schoolEmail || !name || !school || !major || !offerBonusCents) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolEmail, name, school, major, offerBonusCents' },
        { status: 400 }
      );
    }

    // Validate school email format (basic check for .edu domain)
    if (!schoolEmail.includes('@') || (!schoolEmail.endsWith('.edu') && !schoolEmail.includes('university'))) {
      return NextResponse.json(
        { error: 'Please use a valid school email address' },
        { status: 400 }
      );
    }

    if (offerBonusCents < 10000 || offerBonusCents > 100000) { // $100 to $1000
      return NextResponse.json(
        { error: 'Offer bonus must be between $100 and $1,000' },
        { status: 400 }
      );
    }

    // Check if user already exists with school email
    let user = await User.findOne({ 
      $or: [
        { schoolEmail },
        { email: schoolEmail }
      ]
    });
    
    if (user && user.role === 'candidate') {
      return NextResponse.json(
        { error: 'Candidate account already exists with this email' },
        { status: 409 }
      );
    }

    // Create or update user
    if (user) {
      // Update existing user to candidate
      user.role = 'candidate';
      user.schoolEmail = schoolEmail;
      user.schoolEmailVerified = false; // Will be verified via email
      user.name = name;
      user.school = school;
      user.major = major;
      user.minor = minor;
      user.clubs = clubs;
      user.gpa = gpa;
      user.linkedinUrl = linkedinUrl;
      user.offerBonusCents = offerBonusCents;
      
      // Handle file uploads
      if (resumeFile) {
        user.resumeUrl = resumeFile; // Store file URL after upload
      }
      if (profilePicture) {
        user.profileImageUrl = profilePicture; // Store image URL after upload
      }
    } else {
      // Create new candidate user
      user = new User({
        email: schoolEmail, // Use school email as primary email
        schoolEmail,
        schoolEmailVerified: false,
        name,
        role: 'candidate',
        school,
        major,
        minor,
        clubs,
        gpa,
        linkedinUrl,
        offerBonusCents,
        resumeUrl: resumeFile,
        profileImageUrl: profilePicture
      });
    }

    await user.save();

    console.log('Candidate signed up (Phase 5):', user._id, 'School:', school);

    // TODO: Send school email verification email
    // await sendSchoolEmailVerification(schoolEmail, user._id);

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        emailVerificationRequired: true,
        offerBonusPledge: offerBonusCents / 100,
        message: 'Account created successfully! Please check your school email for verification.'
      }
    });

  } catch (error) {
    console.error('Candidate signup error (Phase 5):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/candidate/signup?email=xxx
 * Check signup status for a candidate
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const schoolEmail = searchParams.get('schoolEmail');

    if (!email && !schoolEmail) {
      return NextResponse.json(
        { error: 'Email or schoolEmail parameter is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ 
      $or: [
        { email: email || schoolEmail },
        { schoolEmail: email || schoolEmail }
      ],
      role: 'candidate' 
    }).select('name email schoolEmail schoolEmailVerified school major offerBonusCents');

    if (!user) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          schoolEmail: user.schoolEmail,
          schoolEmailVerified: user.schoolEmailVerified,
          school: user.school,
          major: user.major,
          offerBonusPledge: user.offerBonusCents / 100
        },
        verificationSteps: {
          schoolEmailVerified: user.schoolEmailVerified,
          profileComplete: !!(user.name && user.school && user.major),
          offerBonusSet: !!user.offerBonusCents
        },
        isFullySignedUp: user.schoolEmailVerified
      }
    });

  } catch (error) {
    console.error('Check candidate signup status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/candidate/signup
 * Update candidate profile after initial signup
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'candidate') {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'school', 'major', 'minor', 'clubs', 'gpa', 
      'linkedinUrl', 'profileImageUrl', 'resumeUrl', 'offerBonusCents',
      'targetRole', 'targetIndustry'
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        (user as any)[key] = value;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          name: user.name,
          school: user.school,
          major: user.major,
          offerBonusPledge: user.offerBonusCents / 100
        }
      }
    });

  } catch (error) {
    console.error('Update candidate profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}