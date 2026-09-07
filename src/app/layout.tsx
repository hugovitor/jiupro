import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { metadataBaseUrl } from "@/lib/app-url";
import "./globals.css";

const plex = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: "JiuPro — sistema de gestão para academias de Jiu-Jitsu",
    template: "%s · JiuPro",
  },
  description:
    "Operação da academia: alunos, mensalidades, presença, faixas e estoque. Cada casa, uma conta isolada.",
  applicationName: "JiuPro",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JiuPro",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "JiuPro — sistema de gestão para academias de Jiu-Jitsu",
    description:
      "Operação da academia: alunos, Pix, faixas e presença. Cada casa, uma conta.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${plex.variable} ${plexMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
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
