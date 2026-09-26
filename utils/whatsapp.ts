import { formatCOP } from "./format";

export function productWhatsAppMessage(p: {
  storeName: string;
  name: string;
  sku: string;
  color?: string | null;
  size?: string | null;
  quantity?: number;
  price: number;
  url: string;
}) {
  const lines = [
    `Hola ${p.storeName} 👋`,
    "",
    "Quiero solicitar información/comprar este producto:",
    "",
    `Producto: ${p.name}`,
    `ID: ${p.sku}`,
  ];
  if (p.color) lines.push(`Color: ${p.color}`);
  if (p.size) lines.push(`Talla: ${p.size}`);
  lines.push(`Cantidad: ${p.quantity ?? 1}`);
  lines.push(`Precio: ${formatCOP(p.price)} COP`);
  lines.push("", "Imagen:", p.url, "", "¿Me pueden confirmar disponibilidad y continuar con el pedido?");
  return lines.join("\n");
}

export function shareWhatsAppMessage(p: { storeName: string; name: string; sku: string; url: string }) {
  return `Hola, quiero información sobre este producto de ${p.storeName}:\n${p.name}\nID: ${p.sku}\n${p.url}`;
}

export function orderWhatsAppMessage(p: { storeName: string; orderNumber: string; customer: string; total: number }) {
  return [
    `Hola ${p.storeName} 👋`,
    `Acabo de realizar el pedido #${p.orderNumber}.`,
    "Nombre:",
    p.customer,
    "Total:",
    `${formatCOP(p.total)} COP`,
    "Quiero continuar con la confirmación de mi pedido.",
  ].join("\n");
}

export function adminOrderWhatsAppMessage(p: {
  storeName: string;
  orderNumber: string;
  customer: string;
  total: number;
  items: { product_name: string; sku: string; size: string; color: string; quantity: number }[];
  address: string;
  city: string;
}) {
  const items = p.items.map((i) => `• ${i.product_name} (${i.sku}) · ${i.color} · T${i.size} × ${i.quantity}`).join("\n");
  return [
    `Hola ${p.customer.split(" ")[0]}, te escribimos de ${p.storeName} ✨`,
    "",
    `Sobre tu pedido #${p.orderNumber}:`,
    items,
    "",
    `Total: ${formatCOP(p.total)} COP`,
    `Envío a: ${p.address}, ${p.city}`,
    "",
    "¿Confirmamos tu pedido?",
  ].join("\n");
}
