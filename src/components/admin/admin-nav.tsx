"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function AdminNav({
  groups,
}: {
  groups: { label: string; links: { href: string; label: string }[] }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Panel de administración">
      {groups.map((group) => (
        <div key={group.label} className="admin-nav-group">
          <p>{group.label}</p>
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                pathname === link.href ||
                (link.href !== "/admin" && pathname.startsWith(`${link.href}/`))
                  ? "page"
                  : undefined
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
