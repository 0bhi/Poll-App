import CredentialsProvider from "next-auth/providers/credentials";
import Prisma from "../lib/db";
import bcrypt from "bcrypt";

export const NEXT_AUTH_CONFIG = {
  providers: [
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
        } catch (error) {
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
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.username = user.username;
      }
      return token;
    },
  },
};
