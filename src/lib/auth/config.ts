import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Using JWT strategy stores session in cookie, not database
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
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
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google') {
        console.log('[Auth] Google OAuth sign-in for:', user.email)

        if (!user.email) {
          console.log('[Auth] No email from Google')
          return false
        }

        try {
          // Check if user already exists
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (existingUser) {
            // User exists - link Google account if not already linked
            if (!existingUser.googleId) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  googleId: account.providerAccountId,
                  emailVerified: true, // Auto-verify for OAuth
                  avatarUrl: existingUser.avatarUrl || user.image || null,
                },
              })
              console.log('[Auth] Linked Google account to existing user')
            }
            // Update the user object with our DB user's id
            user.id = existingUser.id
            user.roleId = existingUser.roleId
          } else {
            // Create new user from Google OAuth
            const googleProfile = profile as { given_name?: string; family_name?: string; picture?: string }

            // Generate unique username from email
            const baseUsername = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
            let username = baseUsername
            let counter = 1

            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`
              counter++
            }

            const newUser = await prisma.user.create({
              data: {
                email: user.email,
                username,
                firstName: googleProfile?.given_name || user.name?.split(' ')[0] || '',
                lastName: googleProfile?.family_name || user.name?.split(' ').slice(1).join(' ') || '',
                googleId: account.providerAccountId,
                avatarUrl: googleProfile?.picture || user.image || null,
                emailVerified: true, // Auto-verify for OAuth
                roleId: 2, // Default role (student)
              },
            })
            console.log('[Auth] Created new user from Google OAuth:', newUser.id)
            user.id = newUser.id
            user.roleId = newUser.roleId
          }

          return true
        } catch (error) {
          console.error('[Auth] Google OAuth error:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.roleId = (user as { roleId?: number }).roleId
      }
      // For OAuth, fetch roleId from database if not present
      if (account?.provider === 'google' && !token.roleId && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { roleId: true },
        })
        if (dbUser) {
          token.roleId = dbUser.roleId
        }
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
