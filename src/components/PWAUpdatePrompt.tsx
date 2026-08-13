"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PWAUpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let reloading = false;

    const handleControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    const watchRegistration = (nextRegistration: ServiceWorkerRegistration) => {
      registration = nextRegistration;
      if (nextRegistration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(nextRegistration.waiting);
      }

      nextRegistration.addEventListener("updatefound", () => {
        const installingWorker = nextRegistration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(nextRegistration.waiting ?? installingWorker);
          }
        });
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    navigator.serviceWorker.register("/sw.js").then(watchRegistration).catch((error) => {
      console.error("Service worker registration failed", error);
    });

    const checkForUpdate = () => registration?.update().catch(() => undefined);
    window.addEventListener("focus", checkForUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      window.removeEventListener("focus", checkForUpdate);
    };
  }, []);

  if (!waitingWorker) return null;

  const applyUpdate = () => {
    setUpdating(true);
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-md rounded-2xl border bg-background/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:right-5"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <RefreshCw className={`h-5 w-5 ${updating ? "animate-spin" : ""}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Une mise à jour est prête</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Actualisez cPortal pour utiliser la dernière version.
          </p>
          <Button className="mt-3 w-full sm:w-auto" onClick={applyUpdate} disabled={updating}>
            {updating ? "Mise à jour…" : "Mettre à jour maintenant"}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Reporter la mise à jour"
          onClick={() => setWaitingWorker(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
