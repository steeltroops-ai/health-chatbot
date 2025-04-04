import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const response = await axios.post(`${apiUrl}/auth/login`, {
            username: credentials.username,
            password: credentials.password,
          });

          const data = response.data;

          if (data && data.access_token) {
            return {
              id: data.user.id,
              name: data.user.username,
              email: data.user.email,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
            };
          }

          return null;
        } catch (error: any) {
          console.error("Auth error:", error.response?.data || error.message);
          // Throw error with message for our client-side
          throw new Error(error.response?.data?.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      
      return token;
    },
    async session({ session, token }: any) {
      // Pass token data to the client-side
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        };
      }
      
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  secret: process.env.NEXTAUTH_SECRET || "your-nextauth-secret-change-in-production",
};

export default NextAuth(authOptions);