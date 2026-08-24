import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          scope: "openid email profile",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;
        if (!user.isActive) return null;
        if (!user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        // For credentials sign-in, look up DB user
        if (account?.provider === "credentials") {
          const dbUser = await db.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.sub = dbUser.id;
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } else {
          // For Google / simulated sign-in, sub and id are already set in the token
          token.sub = token.sub || (user as any).id;
          token.id = token.id || (user as any).id;
        }
      }
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token.sub || token.id) as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const existing = await db.user.findUnique({
          where: { email: user.email! },
        });
        if (!existing) {
          await db.user.create({
            data: {
              email: user.email!,
              name: user.name || "Google User",
              avatarUrl: user.image,
              role: "FAMILY",
              phone: "",
              passwordHash: "",
              subscription: "NONE",
            },
          });
        } else {
          await db.user.update({
            where: { email: user.email! },
            data: {
              lastLoginAt: new Date(),
              avatarUrl: user.image || existing.avatarUrl,
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-for-sevasaathi",
};
