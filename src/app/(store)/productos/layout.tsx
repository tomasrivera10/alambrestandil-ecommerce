// Keep catalog prices and stock fresh without making informational pages dynamic.
export const dynamic = "force-dynamic";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
