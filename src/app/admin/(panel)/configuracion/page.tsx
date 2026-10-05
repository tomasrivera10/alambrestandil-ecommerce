import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const settings = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(settings.map((item) => [item.key, item.value]));

  async function save(formData: FormData) {
    "use server";
    const { requireArea } = await import("@/lib/rbac");
    await requireArea("settings");
    const entries = ["whatsapp", "hours", "address", "estimateNotice"];
    for (const key of entries) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(formData.get(key) || "") },
        create: { key, value: String(formData.get(key) || "") },
      });
    }
    revalidatePath("/admin/configuracion");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-3xl">Configuración</h1>
      <form action={save} className="mt-6 grid gap-3 text-sm">
        <label className="grid gap-1">WhatsApp (solo dígitos)
          <input name="whatsapp" defaultValue={map.whatsapp ?? ""} className="h-10 border border-input px-2" />
        </label>
        <label className="grid gap-1">Horario
          <input name="hours" defaultValue={map.hours ?? ""} className="h-10 border border-input px-2" />
        </label>
        <label className="grid gap-1">Dirección pública
          <input name="address" defaultValue={map.address ?? ""} className="h-10 border border-input px-2" />
        </label>
        <label className="grid gap-1">Aviso de estimación
          <textarea name="estimateNotice" defaultValue={map.estimateNotice ?? ""} className="h-24 border border-input p-2" />
        </label>
        <Button type="submit">Guardar</Button>
      </form>
    </div>
  );
}
