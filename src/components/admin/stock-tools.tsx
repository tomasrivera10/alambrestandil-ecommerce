"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function StockTool({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const open = () => {
      if (window.location.hash === `#${id}` && ref.current) ref.current.open = true;
    };
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (anchor?.getAttribute("href") === `#${id}` && ref.current) ref.current.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", open);
      document.removeEventListener("click", onClick);
    };
  }, [id]);
  return (
    <details ref={ref} className="workspace-disclosure admin-anchor" id={id}>
      <summary>
        {title}
        <span>{description}</span>
      </summary>
      {children}
    </details>
  );
}
