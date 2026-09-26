import type { PaymentMethod } from "@/types";
import type { PaymentProvider } from "./types";

const whatsapp: PaymentProvider = {
  id: "whatsapp",
  implemented: true,
  nextStep: () => ({ kind: "whatsapp" }),
};

const transfer: PaymentProvider = {
  id: "transfer",
  implemented: true,
  nextStep: (m) => ({
    kind: "instructions",
    title: "Datos para tu transferencia",
    body: m.public_config?.instructions || "Te enviaremos los datos bancarios por WhatsApp al confirmar tu pedido.",
  }),
};

const cod: PaymentProvider = {
  id: "cod",
  implemented: true,
  nextStep: (m) => ({
    kind: "instructions",
    title: "Pago contra entrega",
    body: m.public_config?.instructions || "Pagarás al recibir tu pedido. Te contactaremos para coordinar la entrega.",
  }),
};

/**
 * Wompi / Mercado Pago: la estructura (claves en payment_secrets, entorno, webhook) ya existe.
 * Para activarlos se implementa `nextStep` creando la transacción en un Route Handler
 * que lea las claves privadas del lado del servidor, y se marca implemented = true.
 */
const wompi: PaymentProvider = { id: "wompi", implemented: false, nextStep: () => ({ kind: "whatsapp" }) };
const mercadopago: PaymentProvider = { id: "mercadopago", implemented: false, nextStep: () => ({ kind: "whatsapp" }) };

export const PAYMENT_PROVIDERS: Record<PaymentMethod["id"], PaymentProvider> = {
  whatsapp,
  transfer,
  cod,
  wompi,
  mercadopago,
};

export function getProvider(id: string): PaymentProvider {
  return PAYMENT_PROVIDERS[id as PaymentMethod["id"]] || whatsapp;
}

export type { PaymentProvider } from "./types";
