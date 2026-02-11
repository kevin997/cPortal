"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

export default function Verify2FAPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  // Redirect logic based on auth state
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      if (session.user.role === "referrer") {
        router.push("/referral/dashboard");
        return;
      }
      if (session.user.twoFactorVerified) {
        router.push("/dashboard");
        return;
      }
    }
  }, [status, session, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async (otpCode: string) => {
    if (otpCode.length !== 6 || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });

      const data = await res.json();

      if (res.ok) {
        await update({ twoFactorVerified: true });
        router.push("/dashboard");
      } else {
        setError(data.error || "Invalid code");
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        setCode("");
      }
    } catch {
      setError("An error occurred. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  }, [loading, update, router]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      const res = await fetch("/api/auth/resend-2fa", {
        method: "POST",
      });

      if (res.ok) {
        setResendCooldown(60);
        setRemainingAttempts(5);
        setError("");
        setCode("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to resend code");
      }
    } catch {
      setError("Failed to resend code");
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Input the code you received on your connected device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md text-center">
              {error}
              {remainingAttempts < 5 && (
                <span className="block mt-1 text-xs">
                  {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                </span>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => handleVerify(code)}
            disabled={code.length !== 6 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Didn't receive a code? Resend"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
