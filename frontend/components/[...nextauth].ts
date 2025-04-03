import NextAuth from 'next-auth'
import CredentialsProvider from "next-auth/providers/credentials"
import axios from 'axios'

export default NextAuth({
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
          const response = await axios.post(`${apiUrl}/auth/login`, {
            username: credentials?.username,
            password: credentials?.password
          })
          
          const data = response.data
          
          if (data.access_token) {
            // Return user data and tokens
            return {
              id: data.user.id,
              name: data.user.username,
              email: data.user.email,
              accessToken: data.access_token,
              refreshToken: data.refresh_token
            }
          }
          
          return null
        } catch (error: any) {
          // Handle server errors or invalid credentials
          const errorMessage = error.response?.data?.message || 'Login failed'
          throw new Error(errorMessage)
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }
      
      // Check if token has expired
      // For simplicity, we're not implementing refresh token logic here
      // In a production app, you would check expiry and refresh if needed
      
      return token
    },
    async session({ session, token }: any) {
      // Pass user data to the session
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        accessToken: token.accessToken
      }
      
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60, // 1 hour
  },
})