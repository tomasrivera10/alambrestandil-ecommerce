"use client";

import { useId, useState, type ReactNode } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

export function FilterOptions({
  children,
  activeCount = 0,
}: {
  children: ReactNode;
  activeCount?: number;
}) {
  const [expanded, setExpanded] = useState(activeCount > 0);
  const id = useId();
  return (
    <div className="workspace-filter-options">
      <button
        type="button"
        className="workspace-filter-toggle"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => setExpanded(!expanded)}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        Filtros{activeCount > 0 ? ` (${activeCount})` : ""}
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      <div id={id} className="workspace-filter-fields" data-expanded={expanded}>
        {children}
      </div>
    </div>
  );
}
