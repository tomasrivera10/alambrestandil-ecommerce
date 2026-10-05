import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <h1 className="font-heading text-4xl">No está esta página</h1>
      <p className="mt-3 text-sm">El producto puede haberse archivado o el enlace quedó viejo.</p>
      <Link href="/productos" className="mt-6 inline-block text-sm underline">
        Volver al catálogo
      </Link>
    </div>
  );
}
