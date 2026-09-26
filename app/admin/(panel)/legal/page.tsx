"use client";

import { useEffect, useState } from "react";
import { Loading, PageHeader, Panel, Switch, useToast } from "@/components/admin/ui";
import { browserClient } from "@/lib/supabase/browser";
import { friendlyError, publishChanges } from "@/lib/admin";
import { LEGAL_SLUGS } from "@/config/site";
import type { LegalPage } from "@/types";
import { renderMarkdown } from "@/utils/markdown";
import { cn, formatDate } from "@/utils/format";

type Version = { id: number; title: string; content: string; created_at: string };

export default function LegalAdmin() {
  const toast = useToast();
  const [pages, setPages] = useState<LegalPage[] | null>(null);
  const [slug, setSlug] = useState<string>("terminos");
  const [draft, setDraft] = useState<LegalPage | null>(null);
  const [preview, setPreview] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    browserClient().from("legal_pages").select("*").then(({ data }) => setPages((data as LegalPage[]) || []));
  }, []);

  useEffect(() => {
    if (!pages) return;
    setDraft(pages.find((p) => p.slug === slug) || null);
    setPreview(false);
    browserClient().from("legal_page_versions").select("*").eq("slug", slug).order("created_at", { ascending: false }).limit(10).then(({ data }) => setVersions((data as Version[]) || []));
  }, [slug, pages]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { data, error } = await browserClient().from("legal_pages").update({ title: draft.title, content: draft.content, published: draft.published }).eq("slug", draft.slug).select().single();
    setSaving(false);
    if (error) return toast(friendlyError(error.message), "error");
    setPages((ps) => ps!.map((p) => (p.slug === draft.slug ? (data as LegalPage) : p)));
    toast("Publicado");
    publishChanges();
  };

  if (!pages) return <Loading />;
  const dirty = draft && pages.find((p) => p.slug === draft.slug)?.content !== draft.content;
  const hasPlaceholders = draft?.content.includes("[");

  return (
    <>
      <PageHeader title="Legal" eyebrow="Políticas y términos" />
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {LEGAL_SLUGS.map((l) => (
          <button key={l.slug} className="chip !min-h-[40px] text-[12px] shrink-0" aria-pressed={slug === l.slug} onClick={() => setSlug(l.slug)}>{l.label}</button>
        ))}
      </div>
      {draft ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <Panel
            className="lg:col-span-2"
            actions={
              <div className="flex gap-1 rounded-full border border-line p-1">
                <button className={cn("px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase", !preview && "bg-ink text-ivory")} onClick={() => setPreview(false)}>Editar</button>
                <button className={cn("px-3.5 py-1.5 rounded-full text-[11px] tracking-[0.14em] uppercase", preview && "bg-ink text-ivory")} onClick={() => setPreview(true)}>Vista previa</button>
              </div>
            }
            title={draft.title}
          >
            {preview ? (
              <div className="prose-ewc min-h-[420px]" dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.content) }} />
            ) : (
              <>
                <input className="input mb-3" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Título" />
                <textarea className="input font-mono !text-[13.5px] min-h-[420px]" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} aria-label="Contenido" />
                <p className="text-[12px] text-stone mt-2">Formato: <code>## Título</code>, <code>### Subtítulo</code>, <code>**negrita**</code>, <code>_cursiva_</code>, <code>- lista</code>.</p>
              </>
            )}
          </Panel>
          <div className="grid gap-4 content-start">
            <Panel>
              <div className="grid gap-5">
                <Switch checked={draft.published} onChange={(v) => setDraft({ ...draft, published: v })} label="Publicada" />
                <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? "Publicando…" : dirty ? "Publicar cambios" : "Guardar"}</button>
                <p className="text-[12px] text-stone">Última actualización: {formatDate(draft.updated_at, true)}</p>
              </div>
            </Panel>
            {hasPlaceholders ? (
              <Panel title="Datos de la empresa">
                <p className="text-[13px] text-stone leading-relaxed">
                  Los textos entre corchetes como <code>[NIT]</code> o <code>[EMAIL]</code> se reemplazan automáticamente con los datos de <strong className="font-medium text-ink">Configuración</strong>. Revisa estos textos con un asesor legal antes de lanzar.
                </p>
              </Panel>
            ) : null}
            <Panel title="Versiones anteriores">
              {versions.length ? (
                <ul className="space-y-2">
                  {versions.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-3">
                      <span className="text-[13px]">{formatDate(v.created_at, true)}</span>
                      <button className="text-[11px] tracking-[0.14em] uppercase link-underline" onClick={() => { setDraft({ ...draft, title: v.title, content: v.content }); toast("Versión cargada; publica para restaurarla"); }}>Restaurar</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-stone">Aún no hay versiones anteriores.</p>
              )}
            </Panel>
          </div>
        </div>
      ) : null}
    </>
  );
}
