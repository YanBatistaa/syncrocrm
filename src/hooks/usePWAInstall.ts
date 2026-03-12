import { useEffect, useState } from "react";

const DISMISSED_KEY = "syncro_pwa_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable,  setIsInstallable]  = useState(false);
  const [isInstalled,    setIsInstalled]    = useState(false);
  const [showBanner,     setShowBanner]     = useState(false);

  useEffect(() => {
    // já é PWA instalado?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);
    if (standalone) return; // rodando como app, não mostra nada

    const dismissed = localStorage.getItem(DISMISSED_KEY) === "true";

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    setShowBanner(false);
    return outcome === "accepted";
  };

  const dismissBanner = (dontShowAgain: boolean) => {
    if (dontShowAgain) localStorage.setItem(DISMISSED_KEY, "true");
    setShowBanner(false);
  };

  return { isInstallable, isInstalled, showBanner, install, dismissBanner };
}
