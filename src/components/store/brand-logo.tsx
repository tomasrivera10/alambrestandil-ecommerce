import Image from "next/image";
export function BrandLogo({ white = false }: { white?: boolean }) {
  return (
    <span className="brand-logo">
      <Image
        src={white ? "/brand/alambres-tandil-logo.webp" : "/brand/alambres-tandil-marca.png"}
        alt="Alambres Tandil · La Casa del Alambrado"
        width={4168}
        height={4168}
        sizes="260px"
      />
    </span>
  );
}
