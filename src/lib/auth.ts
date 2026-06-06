import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { logIp } from "./iplogger";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.login || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.login },
              { username: credentials.login },
            ],
          },
        });

        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        if (user.isBanned) {
          throw new Error("BANNED:" + (user.banReason || "Hesabınız yasaklandı."));
        }

        if (user.timeoutUntil && new Date(user.timeoutUntil) > new Date()) {
          throw new Error("TIMEOUT:" + user.timeoutUntil.toISOString());
        }

        if (user.isRestricted) {
          throw new Error("RESTRICTED:Hesabınıza erişim engeli getirildi.");
        }

        const ip = (req?.headers as Record<string, string | undefined>)?.["x-forwarded-for"] || "unknown";
        await logIp(user.username, ip, "login");
        await prisma.user.update({
          where: { id: user.id },
          data: { lastIp: ip },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          image: user.profileImage,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).username = token.username;
      }
      return session;
    },
  },
};
