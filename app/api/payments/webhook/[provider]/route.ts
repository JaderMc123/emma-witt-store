import { NextResponse } from "next/server";

/**
 * Punto de entrada para webhooks de pasarelas (Wompi, Mercado Pago).
 * Pendiente de integración: verificar firma con el secreto guardado en payment_secrets
 * y actualizar orders.payment_status / status.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  return NextResponse.json({ ok: false, provider, message: "Integración no activa" }, { status: 501 });
}
