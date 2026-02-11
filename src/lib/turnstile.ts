const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  error_codes?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY is not set");
    return { success: false, error: "Server configuration error" };
  }

  if (!token) {
    return { success: false, error: "Turnstile token is required" };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
    });

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      console.error("[turnstile] Verification failed:", JSON.stringify(data));
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

export function getClientIp(request: Request): string | undefined {
  const headers = request.headers;

  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    undefined
  );
}
