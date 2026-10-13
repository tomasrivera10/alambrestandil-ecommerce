"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
export function ActionForm({
  action,
  children,
  className = "",
  success = "Cambios guardados.",
}: {
  action: (form: FormData) => Promise<unknown>;
  children: ReactNode;
  className?: string;
  success?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  return (
    <form
      className={className}
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const data = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        setMessage("");
        try {
          const result = await action(data);
          setMessage(typeof result === "string" ? result : success);
          router.refresh();
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No se pudo guardar. Revisá los datos e intentá de nuevo.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy} className="admin-action-fields">
        {children}
      </fieldset>
      {busy && <p role="status">Guardando…</p>}
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="admin-success">
          {message}
        </p>
      )}
    </form>
  );
}
