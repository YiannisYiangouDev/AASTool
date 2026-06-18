interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Workers not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("Service Worker registered successfully:", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
  }
}

export function listenForPWAInstallPrompt(
  callback: (prompt: PWAInstallPrompt) => void
) {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    callback(e as PWAInstallPrompt);
  });
}

export async function requestInstallPrompt(prompt: PWAInstallPrompt) {
  try {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    return outcome === "accepted";
  } catch (error) {
    console.error("Error requesting install prompt:", error);
  }
}

export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;

  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;

  return isStandalone;
}

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function listenForConnectionStatus(
  callback: (isOnline: boolean) => void
) {
  window.addEventListener("online", () => callback(true));
  window.addEventListener("offline", () => callback(false));
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (!("storage" in navigator) || !("persist" in navigator.storage)) {
    return false;
  }

  try {
    return await navigator.storage.persist();
  } catch (error) {
    console.error("Failed to request persistent storage:", error);
    return false;
  }
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
} | null> {
  if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota ? (estimate.usage || 0) / estimate.quota : 0,
    };
  } catch (error) {
    console.error("Failed to estimate storage:", error);
    return null;
  }
}
