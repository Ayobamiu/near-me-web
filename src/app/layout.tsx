import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NearMe - Connect with People Nearby",
  description:
    "Join places and connect with people in your area. Discover local communities, chat with nearby users, and build meaningful connections.",
  keywords: [
    "social",
    "local",
    "community",
    "chat",
    "nearby",
    "places",
    "connection",
  ],
  authors: [{ name: "NearMe Team" }],
  creator: "NearMe",
  publisher: "NearMe",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "NearMe - Connect with People Nearby",
    description:
      "Join places and connect with people in your area. Discover local communities, chat with nearby users, and build meaningful connections.",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    siteName: "NearMe",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NearMe - Connect with People Nearby",
    description:
      "Join places and connect with people in your area. Discover local communities, chat with nearby users, and build meaningful connections.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <PresenceProvider>{children}</PresenceProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
