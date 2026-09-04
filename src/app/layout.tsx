import type { Metadata, Viewport } from "next";
import { Geist_Mono, Syne } from "next/font/google";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tatame — gestão para academias de Jiu-Jitsu",
    template: "%s · Tatame",
  },
  description:
    "Alunos, mensalidades, faixas, presença e estoque em um só lugar. O PWA dos alunos marca presença e acompanha a evolução.",
  applicationName: "Tatame",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tatame",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#2a2418",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${dmSans.variable} ${syne.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
