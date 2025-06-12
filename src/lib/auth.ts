import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { connectDB } from '../lib/models/db';
import User from './models/User';

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
          scope: 'r_liteprofile r_emailaddress'
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        console.error('No email provided by OAuth provider');
        return false;
      }

      try {
        await connectDB();
        
        // Check if user exists
        let existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user without role - they'll set it in setup
          existingUser = new User({
            email: user.email,
            name: user.name || 'Unknown User',
            profileImageUrl: user.image,
            // Store OAuth tokens for calendar integration
            ...(account?.provider === 'google' && account.access_token && {
              googleCalendarToken: account.access_token
            })
          });
          
          await existingUser.save();
          console.log('Created new OAuth user:', existingUser._id);
        } else {
          // Update existing user with latest profile info
          existingUser.name = user.name || existingUser.name;
          existingUser.profileImageUrl = user.image || existingUser.profileImageUrl;
          
          // Update Google Calendar token if available
          if (account?.provider === 'google' && account.access_token) {
            existingUser.googleCalendarToken = account.access_token;
          }
          
          await existingUser.save();
          console.log('Updated existing OAuth user:', existingUser._id);
        }
        
        return true;
      } catch (error) {
        console.error('Error during OAuth sign in:', error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.role = dbUser.role;
          token.profileComplete = !!(dbUser.role && 
            (dbUser.role === 'candidate' ? dbUser.school : dbUser.company));
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.profileComplete = token.profileComplete as boolean;
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
  }
}