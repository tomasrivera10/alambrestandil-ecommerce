import type { Metadata } from "next";
import { Archivo, Figtree, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const display = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Alambres Tandil | La Casa del Alambrado",
    template: "%s | Alambres Tandil",
  },
  description:
    "Tejidos, postes, portones y cercos perimetrales en Tandil. Armá el pedido y cerramos los detalles por WhatsApp.",
};

const brandCss = `
:root {
  color-scheme: light;
  --background: #ffffff !important;
  --foreground: #222222 !important;
  --ink: #121212 !important;
  --primary: #d30000 !important;
  --primary-foreground: #ffffff !important;
  --accent: #d30000 !important;
  --ring: #d30000 !important;
  --card: #ffffff !important;
  --muted: #eeeeee !important;
  --muted-foreground: #727272 !important;
  --secondary: #eeeeee !important;
  --border: #d6d6d6 !important;
}
.bg-primary { background-color: #d30000 !important; color: #fff !important; }
.bg-primary:hover { background-color: #a80000 !important; }
.text-primary { color: #d30000 !important; }
.bg-ink, .site-header, .at-hero { background-color: #121212 !important; }
.bg-background { background-color: #ffffff !important; }
.at-hero { color: #fff; }
.at-hero-grid { display: grid; max-width: 80rem; margin-inline: auto; }
.at-hero-copy { display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; padding: 3rem 1rem 2.5rem; }
.at-hero-kicker { margin: 0; color: #d30000; font-size: 0.75rem; letter-spacing: 0.04em; }
.at-hero-title { margin: 0.75rem 0 0; max-width: 36rem; font-family: var(--font-archivo), sans-serif; font-size: clamp(2.25rem, 4vw, 3.75rem); line-height: 1.05; font-weight: 500; }
.at-hero-lead { margin: 1rem 0 0; max-width: 28rem; color: rgb(255 255 255 / 0.78); line-height: 1.6; }
.at-hero-address { margin: 2rem 0 0; color: rgb(255 255 255 / 0.62); font-size: 0.875rem; }
.at-hero-cta { display: inline-flex; align-items: center; height: 2.5rem; margin-top: 1.5rem; padding: 0 1rem; background: #d30000 !important; color: #fff !important; font-size: 0.875rem; text-decoration: none; }
.at-hero-cta:hover { background: #a80000 !important; }
.at-hero-img { display: block; width: 100%; height: 18rem; object-fit: cover; object-position: 70% center; }
.cat-grid { display: grid; margin-top: 1.5rem; border-top: 1px solid #d6d6d6; border-left: 1px solid #d6d6d6; background: #fff; }
.cat-cell { display: block; background: #fff; border-right: 1px solid #d6d6d6; border-bottom: 1px solid #d6d6d6; padding: 1.25rem; color: inherit; text-decoration: none; }
.cat-cell:hover { background: #f7f7f7; }
@media (min-width: 640px) {
  .cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cat-span { grid-column: span 2; }
}
@media (min-width: 768px) {
  .at-hero-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); min-height: 38rem; }
  .at-hero-copy { padding: 4rem 2rem; }
  .at-hero-media { min-height: 38rem; }
  .at-hero-img { height: 100%; min-height: 38rem; object-position: left center; }
}
@media (min-width: 1024px) {
  .cat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <style dangerouslySetInnerHTML={{ __html: brandCss }} />
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
