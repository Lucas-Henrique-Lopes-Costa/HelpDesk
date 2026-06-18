import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "HelpDesk Operacional",
  description: "Sistema de chamados operacionais — UFLA GCC267",
  manifest: "/manifest.webmanifest",
  applicationName: "HelpDesk",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HelpDesk",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <Topbar />
          <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
