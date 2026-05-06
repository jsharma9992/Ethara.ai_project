import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUserProfile } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ethara.ai — Project Manager",
  description: "Internal project and task management for Ethara.ai"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentUserProfile();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <AppShell profile={profile}>{children}</AppShell>
      </body>
    </html>
  );
}
