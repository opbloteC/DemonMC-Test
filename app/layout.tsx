import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DemonMC — The Biggest Minecraft Network",
    template: "%s · DemonMC",
  },
  description:
    "DemonMC is a Minecraft network built for competitive players. Join at demonmc.mcpe.network and build your legacy.",
  applicationName: "DemonMC",
  openGraph: {
    title: "DemonMC — The Biggest Minecraft Network",
    description: "Enter the world. Build your legacy. Join DemonMC at demonmc.mcpe.network.",
    siteName: "DemonMC",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
