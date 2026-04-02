import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Space_Grotesk } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { getShellProfile } from "@/app/profile/actions";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "CoLabs – Collaborate with others",
  description: "CoLabs is an app for collaborating with other people in shared work spaces.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellProfile = await getShellProfile();
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <ClerkProvider>
          <AppShell shellProfile={shellProfile}>{children}</AppShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
