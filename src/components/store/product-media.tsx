export function ProductMedia({
  src,
  alt,
  name,
  ratio = "aspect-[4/5]",
}: {
  src: string | null;
  alt: string | null;
  name: string;
  ratio?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt || name} className={`${ratio} w-full object-cover`} />
    );
  }
  return (
    <div className={`mesh-ground ${ratio} flex items-end p-4`}>
      <span className="bg-card/90 px-2 py-1 font-heading text-sm text-ink">{name}</span>
    </div>
  );
}
