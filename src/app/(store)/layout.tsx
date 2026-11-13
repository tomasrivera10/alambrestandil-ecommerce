import "./storefront.css";
import { Suspense } from "react";
import { StoreRouteLoading } from "@/components/store/store-route-loading";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { listCategories } from "@/server/products/queries";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = (await listCategories()).map(({ slug, name }) => ({ slug, name }));
  return (
    <div className="storefront flex min-h-full flex-col">
      <Suspense fallback={null}>
        <StoreRouteLoading />
      </Suspense>
      <SiteHeader categories={categories} />
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
