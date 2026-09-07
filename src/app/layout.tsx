import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { metadataBaseUrl } from "@/lib/app-url";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: "JiuPro — gestão para academias de Jiu-Jitsu",
    template: "%s · JiuPro",
  },
  description:
    "Alunos, mensalidades, faixas, presença e estoque. O aluno marca presença no celular e acompanha a própria faixa.",
  applicationName: "JiuPro",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JiuPro",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "JiuPro — gestão para academias de Jiu-Jitsu",
    description:
      "Operação da academia: alunos, Pix, faixas e presença. Cada casa, uma conta.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} h-full antialiased`}
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
