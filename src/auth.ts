import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTurnstile, getClientIp } from "@/lib/turnstile";
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
      authorize: async (credentials, request) => {
        try {
          const { email, password, turnstileToken } = credentials as {
            email: string;
            password: string;
            turnstileToken: string;
          };

          if (!email || !password) {
            console.log("[auth] Missing email or password");
            return null;
          }

          // Verify Turnstile token
          const clientIp = request ? getClientIp(request) : undefined;
          const turnstileResult = await verifyTurnstile(turnstileToken, clientIp);
          if (!turnstileResult.success) {
            console.log("[auth] Turnstile verification failed");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("[auth] User not found:", email);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            console.log("[auth] Invalid password for:", email);
            return null;
          }

          console.log("[auth] Password valid for:", email, "role:", user.role);

          // For non-referrer roles: generate 2FA code and send to Telegram
          if (user.role !== "referrer") {
            const code = generate2FACode();
            const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            console.log("[auth] Storing 2FA code for:", email);

            await prisma.user.update({
              where: { id: user.id },
              data: {
                twoFactorCode: code,
                twoFactorExpiry: expiry,
                twoFactorAttempts: 0,
                twoFactorVerifiedAt: null,
              },
            });

            console.log("[auth] 2FA code stored, sending Telegram notification");

            const escapedName = TelegramService.escapeMarkdownV2(user.name);
            const escapedCode = TelegramService.escapeMarkdownV2(code);
            const message = `🔐 *2FA Login Code*\n\n👤 *User:* ${escapedName}\n🔑 *Code:* \`${escapedCode}\`\n\n⏰ Expires in 5 minutes`;

            await TelegramService.sendMessage(message);

            console.log("[auth] 2FA setup complete, returning user with twoFactorVerified: false");

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
          console.log("[auth] Referrer login, skipping 2FA");
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar ?? undefined,
            twoFactorVerified: true,
          };
        } catch (error) {
          console.error("[auth] authorize() threw an error:", error);
          return null;
        }
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
