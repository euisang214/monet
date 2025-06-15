import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { connectDB } from '@/lib/models/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar.events'
        }
      }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email'
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        console.log('OAuth sign in attempt:', { user: user.email, provider: account?.provider });
        
        await connectDB();
        
        // Import User model only when needed to avoid compilation issues
        const { default: User } = await import('@/lib/models/User');
        
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user
          const newUser = new User({
            email: user.email,
            name: user.name,
            profileImageUrl: user.image,
            authenticated: true,
            profileComplete: false,
            // Google Calendar token
            ...(account?.provider === 'google' && account.access_token && {
              googleCalendarToken: account.access_token
            })
          });

          await newUser.save();
          console.log('Created new OAuth user:', newUser._id);
        } else {
          // Update existing user with latest profile info
          existingUser.name = user.name || existingUser.name;
          existingUser.profileImageUrl = user.image || existingUser.profileImageUrl;

          // Update Google Calendar token if available
          if (account?.provider === 'google' && account.access_token) {
            existingUser.googleCalendarToken = account.access_token;
          }

          existingUser.authenticated = true;
          existingUser.profileComplete = !!(existingUser.role &&
            (existingUser.role === 'candidate' ? existingUser.school : existingUser.company));

          await existingUser.save();
          console.log('Updated existing OAuth user:', existingUser._id);
        }
        
        return true;
      } catch (error) {
        console.error('Error during OAuth sign in:', error);
        return false;
      }
    },

    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        if (session.role) {
          token.role = session.role as string;
        }
        if (typeof session.profileComplete !== 'undefined') {
          token.profileComplete = session.profileComplete as boolean;
        }
      }

      if (user) {
        try {
          await connectDB();
          const { default: User } = await import('@/lib/models/User');
          
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.userId = dbUser._id.toString();
            token.role = dbUser.role;
            token.profileComplete = dbUser.profileComplete;
            token.authenticated = dbUser.authenticated;
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.profileComplete = token.profileComplete as boolean;
        session.user.authenticated = token.authenticated as boolean;
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },

  session: {
    strategy: 'jwt'
  },

  secret: process.env.NEXTAUTH_SECRET
};

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      profileComplete?: boolean;
      authenticated?: boolean;
    };
  }

  interface User {
    id: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: string;
    profileComplete?: boolean;
    authenticated?: boolean;
  }
}