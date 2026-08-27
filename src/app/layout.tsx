import type { Metadata } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "صوت الذكاء — استوديو تحويل النص إلى صوت واستنساخ الصوت",
  description:
    "استوديو متكامل لتحويل النص إلى صوت عالي الجودة باستخدام MiniMax Speech 2.8 HD، مع استنساخ الصوت وإدارة مفاتيح API — بدون تسجيل دخول.",
  keywords: [
    "تحويل النص إلى صوت",
    "استنساخ الصوت",
    "TTS",
    "MiniMax",
    "YepAPI",
    "صوت ذكاء اصطناعي",
  ],
  authors: [{ name: "VoiceCraft" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "صوت الذكاء — استوديو الصوت بالذكاء الاصطناعي",
    description: "تحويل النص إلى صوت واستنساخ الصوت بدون تسجيل دخول",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
