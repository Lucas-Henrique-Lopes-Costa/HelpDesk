import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Topbar } from "@/components/Topbar";

export const metadata: Metadata = {
  title: "HelpDesk Operacional",
  description: "Sistema de chamados operacionais — UFLA GCC267",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <Topbar />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
