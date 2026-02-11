import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTurnstile } from "@/lib/turnstile";
import { TelegramService } from "@/lib/telegram";

function generate2FACode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        turnstileToken: {},
      },
      authorize: async (credentials, _request) => {
        const { email, password, turnstileToken } = credentials as {
          email: string;
          password: string;
          turnstileToken: string;
        };

        if (!email || !password) {
          return null;
        }

        // Verify Turnstile token
        const turnstileResult = await verifyTurnstile(turnstileToken);
        if (!turnstileResult.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // For non-referrer roles: generate 2FA code and send to Telegram
        if (user.role !== "referrer") {
          const code = generate2FACode();
          const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

          await prisma.user.update({
            where: { id: user.id },
            data: {
              twoFactorCode: code,
              twoFactorExpiry: expiry,
              twoFactorAttempts: 0,
              twoFactorVerifiedAt: null,
            },
          });

          const escapedName = TelegramService.escapeMarkdownV2(user.name);
          const escapedCode = TelegramService.escapeMarkdownV2(code);
          const message = `🔐 *2FA Login Code*\n\n👤 *User:* ${escapedName}\n🔑 *Code:* \`${escapedCode}\`\n\n⏰ Expires in 5 minutes`;

          await TelegramService.sendMessage(message);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar ?? undefined,
            twoFactorVerified: false,
          };
        }

        // Referrer: no 2FA needed
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar ?? undefined,
          twoFactorVerified: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.avatar = user.avatar;
        token.twoFactorVerified = user.twoFactorVerified ?? false;
      }

      // When session.update() is called after 2FA verification
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { twoFactorVerifiedAt: true },
        });

        if (
          dbUser?.twoFactorVerifiedAt &&
          Date.now() - dbUser.twoFactorVerifiedAt.getTime() < 10 * 60 * 1000
        ) {
          token.twoFactorVerified = true;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | undefined;
        session.user.twoFactorVerified = token.twoFactorVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
