import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // PrismaAdapter removed - not needed for JWT strategy with Credentials provider
  // Using JWT strategy stores session in cookie, not database
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] Login attempt for:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        console.log('[Auth] User found:', !!user)

        if (!user || !user.passwordHash) {
          console.log('[Auth] User not found or no password hash')
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        console.log('[Auth] Password valid:', isPasswordValid)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
          image: user.avatarUrl,
          roleId: user.roleId,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.roleId = (user as { roleId?: number }).roleId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.roleId = token.roleId as number
      }
      return session
    },
  },
})

// Extend the types for TypeScript
declare module 'next-auth' {
  interface User {
    roleId?: number
  }
  interface Session {
    user: {
      id: string
      roleId?: number
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
  interface JWT {
    id?: string
    roleId?: number
  }
}
