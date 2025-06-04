import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { connectDB } from './db';
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
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.error('No email provided by OAuth provider');
        return false;
      }

      try {
        await connectDB();
        
        // Check if user exists
        let existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // Create new user - default to candidate role
          existingUser = new User({
            email: user.email,
            name: user.name || 'Unknown User',
            role: 'candidate', // Default role
            profileImageUrl: user.image,
            // Store OAuth tokens for calendar integration
            ...(account?.provider === 'google' && account.access_token && {
              googleCalendarToken: account.access_token
            })
          });
          
          await existingUser.save();
          console.log('Created new user:', existingUser._id);
        } else {
          // Update existing user with latest profile info
          existingUser.name = user.name || existingUser.name;
          existingUser.profileImageUrl = user.image || existingUser.profileImageUrl;
          
          // Update Google Calendar token if available
          if (account?.provider === 'google' && account.access_token) {
            existingUser.googleCalendarToken = account.access_token;
          }
          
          await existingUser.save();
        }
        
        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
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

/**
 * Get current user from session
 */
export async function getCurrentUser(req: any): Promise<any | null> {
  try {
    // This would typically use getServerSession in a real app
    // For now, return null to indicate no auth implemented yet
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}