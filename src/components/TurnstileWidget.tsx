"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onSuccess, onError, onExpire }, ref) => {
    const turnstileRef = useRef<TurnstileInstance | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        turnstileRef.current?.reset();
      },
    }));

    return (
      <div className="flex justify-center">
        <Turnstile
          ref={turnstileRef}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={onSuccess}
          onError={() => onError?.()}
          onExpire={() => onExpire?.()}
          options={{
            theme: "auto",
            size: "flexible",
          }}
        />
      </div>
    );
  }
);

TurnstileWidget.displayName = "TurnstileWidget";

export default TurnstileWidget;
