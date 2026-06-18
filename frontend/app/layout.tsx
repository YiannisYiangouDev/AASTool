import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/mobile-nav";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAProvider } from "@/components/PWAProvider";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Providers from "@/components/Providers";
import SplashScreen from "@/components/SplashScreen";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AASTool",
  description: "AASTool — Accessibility Assessment Scheme | by Serg | Dev by Y",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AASTool",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <head />
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            <ThemeProvider>
              <OfflineIndicator />
              <PWAProvider />
              <SplashScreen />
              {children}
              <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
                AASTool by Serg | Dev by Y
              </footer>
            </ThemeProvider>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}