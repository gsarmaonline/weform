import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { api } from './api/client'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On first sign-in, exchange the Google ID token for our backend JWT
      if (account?.id_token) {
        try {
          const res = await api.post<{ token: string; user: { id: string; email: string; fullName: string } }>(
            '/auth/google',
            { idToken: account.id_token },
          )
          token.backendToken = res.token
          token.userId = res.user.id
        } catch (err) {
          console.error('Backend auth exchange failed', err)
        }
      }
      return token
    },
    async session({ session, token }) {
      session.backendToken = token.backendToken as string
      session.userId = token.userId as string
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
})
