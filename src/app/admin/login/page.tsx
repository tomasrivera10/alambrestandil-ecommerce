"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="font-heading text-3xl">Ingreso al panel</h1>
      <form
        className="mt-6 grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setError(null);
          setPending(true);
          const form = new FormData(event.currentTarget);
          try {
            const result = await authClient.signIn.email({
              email: String(form.get("email")),
              password: String(form.get("password")),
              rememberMe: false,
            });
            if (result.error) {
              setError(
                result.error.status === 429
                  ? "Demasiados intentos. Esperá un minuto y volvé a intentar."
                  : "No se pudo ingresar. Revisá el correo y la contraseña.",
              );
              return;
            }
            router.push("/admin");
            router.refresh();
          } catch {
            setError("No se pudo conectar. Volvé a intentar en unos momentos.");
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="grid gap-1 text-sm">
          Correo
          <Input name="email" type="email" autoComplete="username" maxLength={254} required />
        </label>
        <label className="grid gap-1 text-sm">
          Contraseña
          <Input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Ingresando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
