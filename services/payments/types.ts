import type { PaymentMethod } from "@/types";

export type PaymentNextStep =
  | { kind: "whatsapp" }
  | { kind: "instructions"; title: string; body: string }
  | { kind: "redirect"; url: string };

export type OrderSummary = { orderNumber: string; total: number; token: string };

/**
 * Capa de abstracción de pagos. Cada pasarela implementa esta interfaz;
 * carrito, checkout y pedidos no dependen de ninguna en particular.
 */
export interface PaymentProvider {
  id: PaymentMethod["id"];
  /** ¿Está implementado en código? (una pasarela puede tener claves pero no estar integrada aún) */
  implemented: boolean;
  /** Qué ve el cliente después de crear el pedido. */
  nextStep(method: PaymentMethod, order: OrderSummary): Promise<PaymentNextStep> | PaymentNextStep;
}
