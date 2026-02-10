const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set");
    return { success: false, error: "Server configuration error" };
  }

  if (!token) {
    return { success: false, error: "Turnstile token is required" };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: "Bot verification failed. Please try again.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Verification service unavailable" };
  }
}
