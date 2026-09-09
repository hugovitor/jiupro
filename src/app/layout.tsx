import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { metadataBaseUrl, shouldIndexSite } from "@/lib/app-url";
import { productTitle, PRODUCT_NAME } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
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
    default: productTitle(),
    template: `%s · ${PRODUCT_NAME}`,
  },
  description:
    "Operação da academia: alunos, mensalidades, presença, faixas e estoque. Cada casa, uma conta isolada.",
  applicationName: PRODUCT_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PRODUCT_NAME,
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: productTitle(),
    description:
      "Operação da academia: alunos, Pix, faixas e presença. Cada casa, uma conta.",
    locale: "pt_BR",
    type: "website",
  },
  robots: shouldIndexSite()
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${plexMono.variable} dark h-full`}
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
