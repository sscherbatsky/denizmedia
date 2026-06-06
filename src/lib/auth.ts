import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";
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
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET
      ? [
          TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID,
            clientSecret: process.env.TWITTER_CLIENT_SECRET,
            version: "2.0",
          }),
        ]
      : []),
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

        if (!user || !user.password) return null;

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
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "twitter") {
        const email = user.email;
        if (!email) return false;

        let dbUser = await prisma.user.findUnique({ where: { email } });

        if (!dbUser) {
          const baseUsername = (user.name || email.split("@")[0])
            .toLowerCase()
            .replace(/[^a-z0-9._]/g, "")
            .slice(0, 25);

          let username = baseUsername;
          let counter = 1;
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter}`;
            counter++;
          }

          dbUser = await prisma.user.create({
            data: {
              email,
              username,
              displayName: user.name || username,
              profileImage: user.image || null,
            },
          });
        }

        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token as string | undefined,
              access_token: account.access_token as string | undefined,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token as string | undefined,
            },
          });
        }

        await logIp(dbUser.username, "oauth", "login");
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" || account?.provider === "twitter") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.username = dbUser.username;
          }
        } else {
          token.id = user.id;
          token.username = user.name || "";
        }
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
