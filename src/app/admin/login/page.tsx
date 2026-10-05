"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="font-heading text-3xl">Ingreso al panel</h1>
      <form
        className="mt-6 grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const result = await authClient.signIn.email({
            email: String(form.get("email")),
            password: String(form.get("password")),
          });
          if (result.error) {
            setError("Correo o contraseña incorrectos.");
            return;
          }
          router.push("/admin");
          router.refresh();
        }}
      >
        <label className="grid gap-1 text-sm">
          Correo
          <Input name="email" type="email" required />
        </label>
        <label className="grid gap-1 text-sm">
          Contraseña
          <Input name="password" type="password" required />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit">Entrar</Button>
      </form>
    </main>
  );
}
