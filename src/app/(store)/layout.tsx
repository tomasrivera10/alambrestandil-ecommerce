import "./storefront.css";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="storefront flex min-h-full flex-col">
      <SiteHeader />
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
