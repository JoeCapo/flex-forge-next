import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flex Forge",
  description: "Next Generation Workout Tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Theme will be fetched client-side or per-page as needed
  const theme = undefined;

  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased bg-background text-foreground tracking-tight selection:bg-primary/30 min-h-screen"
        )}
      >
        <ThemeProvider theme={theme}>
          <Navigation />
          <main className="md:pl-64 min-h-screen pb-20 md:pb-0 transition-all duration-300">
            <div className="max-w-7xl mx-auto p-4 md:p-8 pt-6 md:pt-10">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
