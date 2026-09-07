import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { metadataBaseUrl } from "@/lib/app-url";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
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
    statusBarStyle: "black-translucent",
    title: "JiuPro",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "JiuPro — gestão para academias de Jiu-Jitsu",
    description:
      "O quadro da casa: alunos, Pix, faixas e presença. Cada academia, uma conta.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`dark tatame ${outfit.variable} ${bebas.variable} ${geistMono.variable} h-full antialiased`}
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
