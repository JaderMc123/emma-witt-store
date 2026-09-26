function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s: string) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])_(.+?)_(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>');
}

/** Markdown mínimo y seguro (escapa HTML): ##, ###, listas, negrita, cursiva, enlaces. */
export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list.length) out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`);
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const level = Math.min(3, h[1].length + 1);
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const li = line.match(/^[-*]\s+(.*)$/);
    if (li) { flushPara(); list.push(li[1]); continue; }
    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return out.join("\n");
}

/** Reemplaza los placeholders legales con los datos configurados (si existen). */
export function fillLegalPlaceholders(
  md: string,
  s: { legal_name?: string | null; nit?: string | null; address?: string | null; email?: string | null; phone?: string | null }
) {
  const map: Record<string, string | null | undefined> = {
    "[NOMBRE LEGAL DE LA EMPRESA]": s.legal_name,
    "[NIT]": s.nit,
    "[DIRECCIÓN]": s.address,
    "[EMAIL]": s.email,
    "[TELÉFONO]": s.phone,
  };
  let result = md;
  for (const [k, v] of Object.entries(map)) if (v) result = result.split(k).join(v);
  return result;
}
