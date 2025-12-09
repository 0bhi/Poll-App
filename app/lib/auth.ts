import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import Prisma from "../lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const NEXT_AUTH_CONFIG = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials) {
          throw new Error("Missing credentials");
        }

        try {
          const user = await Prisma.user.findFirst({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            throw new Error("No user found with the given email");
          }

          const validPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!validPassword) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            username: user.username,
          };
        } catch (error: any) {
          // Re-throw specific authentication errors
          if (error instanceof Error && (
            error.message === "No user found with the given email" ||
            error.message === "Invalid password" ||
            error.message === "Missing credentials"
          )) {
            throw error;
          }
          // For other errors, log and throw generic error
          console.error(error);
          throw new Error("An unexpected error occurred during authentication");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }: any) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.username = token.username;
      session.user.image = token.picture;
      return session;
    },
    async jwt({ token, user, profile, account }: any) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
        token.picture = user.profilePicture;
      }
      if (account?.provider === "google" && profile) {
        const dbUser = await Prisma.user.findUnique({
          where: { email: profile.email },
        });
        if (dbUser) {
          token.id = dbUser?.id;
          token.picture = profile.picture;
          token.username = dbUser?.username;
        }
      }
      return token;
    },
    async signIn({ account, profile }: any) {
      if (account?.provider === "google") {
        try {
          const username = profile.email.split("@")[0];

          let finalUsername = username;
          let counter = 1;
          while (true) {
            const existingUser = await Prisma.user.findUnique({
              where: { username: finalUsername },
            });
            if (!existingUser) break;
            finalUsername = `${username}${counter}`;
            counter++;
          }

          // For OAuth users, generate a secure random password that cannot be used for credentials login
          // This password is never exposed and OAuth users can only sign in via OAuth
          const oauthPassword = crypto.randomBytes(64).toString("hex");
          
          await Prisma.user.upsert({
            where: {
              email: profile.email,
            },
            update: {},
            create: {
              email: profile.email,
              name: profile.name,
              username: finalUsername,
              profilePicture: profile.picture,
              password: oauthPassword, // OAuth users cannot use credentials login
            },
          });
          return true;
        } catch (error) {
          console.error("Error saving Google profile:", error);
          return false;
        }
      }
      return true;
    },
  },
};
