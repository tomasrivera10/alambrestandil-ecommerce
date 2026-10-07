import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Decinos tu nombre.").max(80),
  phone: z.string().trim().min(8, "El teléfono está incompleto.").max(30),
  locality: z.string().trim().min(2, "Indicá la localidad.").max(80),
  fulfillment: z.enum(["RETIRO", "ENVIO"]),
  address: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1).max(128),
        quantity: z.number().positive().max(9999),
        notes: z.string().max(200).optional(),
      }),
    )
    .min(1, "El pedido está vacío.").max(100),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
