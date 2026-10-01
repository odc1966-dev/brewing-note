import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { asset } from "@/lib/base";

export const metadata: Metadata = {
  title: "Brewing note",
  description: "홈 바리스타를 위한 커피 추출·카페 기록 노트",
  manifest: asset("/manifest.webmanifest"),
  icons: { icon: asset("/icon-192.png"), apple: asset("/apple-touch-icon.png") },
  appleWebApp: { capable: true, title: "Brewing note", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f5efe6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
