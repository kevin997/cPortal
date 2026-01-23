"use client";

import * as amplitude from "@amplitude/unified";

function initAmplitude() {
  if (typeof window !== "undefined") {
    const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
    if (!apiKey) {
      console.warn("Amplitude API key not configured. Skipping initialization.");
      return;
    }

    amplitude.initAll(apiKey, {
      analytics: { autocapture: true },
      sessionReplay: { sampleRate: 1 },
    });
  }
}

initAmplitude();

export const Amplitude = () => null;
export default amplitude;
