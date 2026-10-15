"use client";

import { THEMES, THEME_IDS, resolveTheme, type ThemeChoice } from "@/lib/themes";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, ImagePlus, KeyRound, Loader2, Trash2, XCircle } from "lucide-react";
import { changePassword } from "@/actions/auth";
import { saveSettings } from "@/actions/settings";
import { useImageUpload } from "@/components/admin/image-uploader";
import { useRun } from "@/components/admin/use-run";
import SmartImage from "@/components/ui/smart-image";
import { formatPhone } from "@/lib/format";
import type { AdminSettingsDTO } from "@/lib/admin-types";
import type { HeroSlide } from "@/lib/types";

export type LinkOption = { label: string; href: string };
export type SystemStatus = { database: boolean; storage: boolean; siteUrl: string; passwordCustom: boolean };

function Status({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <li className={ok ? "is-ok" : "is-bad"}>
      {ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <div>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </li>
  );
}

export default function SettingsForm({ settings, linkOptions, status }: { settings: AdminSettingsDTO; linkOptions: LinkOption[]; status: SystemStatus }) {
  const { run, busy } = useRun();
  const { upload, uploading } = useImageUpload();
  const file = useRef<HTMLInputElement>(null);

  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber ? formatPhone(settings.whatsappNumber) : "");
  const [instagram, setInstagram] = useState(settings.instagramUrl ?? "");
  const [announcement, setAnnouncement] = useState(settings.announcement ?? "");
  const [delivery, setDelivery] = useState(settings.deliveryInfo ?? "");
  const [slides, setSlides] = useState<HeroSlide[]>(settings.heroSlides);
  const [theme, setTheme] = useState<string>(settings.siteTheme);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const addSlides = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls = await upload(Array.from(files).slice(0, 10 - slides.length));
    if (urls.length) setSlides((s) => [...s, ...urls.map((src) => ({ src, href: "" }))]);
    if (file.current) file.current.value = "";
  };
  const move = (i: number, d: -1 | 1) =>
    setSlides((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const c = [...s];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => saveSettings({ whatsappNumber: whatsapp, instagramUrl: instagram, announcement, deliveryInfo: delivery, heroSlides: slides, siteTheme: theme as ThemeChoice }), { success: "Configurações salvas." });
  };

  const submitPw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (next.length < 6) return setPwError("A nova senha precisa ter pelo menos 6 caracteres.");
    if (next !== next2) return setPwError("As senhas novas não são iguais.");
    await run(() => changePassword(cur, next), {
      onError: setPwError,
      success: "Senha alterada. Você continua conectado neste aparelho.",
      onDone: () => {
        setCur("");
        setNext("");
        setNext2("");
      },
    });
  };

  return (
    <div className="stack">
      <form className="form-stack" onSubmit={submit} noValidate>
        <section className="card panel" id="contato">
          <div className="panel-head">
            <h2>Contato e pedidos</h2>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-wa">WhatsApp da loja</label>
              <input id="s-wa" className="input" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-8888" />
              <span className="hint">Os pedidos dos clientes chegam neste número.</span>
            </div>
            <div className="field">
              <label htmlFor="s-ig">Instagram</label>
              <input id="s-ig" className="input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@lavena.saboaria" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-ann">Aviso no topo do site</label>
            <input id="s-ann" className="input" value={announcement} onChange={(e) => setAnnouncement(e.target.value)} maxLength={160} placeholder="Ex.: Frete grátis acima de R$ 150 🌿" />
            <span className="hint">Deixe vazio para não mostrar nenhuma faixa.</span>
          </div>
          <div className="field">
            <label htmlFor="s-del">Informações de entrega</label>
            <textarea id="s-del" className="textarea" rows={3} value={delivery} onChange={(e) => setDelivery(e.target.value)} maxLength={600} placeholder="Ex.: Entregamos na região e enviamos para todo o Brasil. Prazo combinado pelo WhatsApp." />
          </div>
        </section>

        <section className="card panel" id="versao">
          <div className="panel-head">
            <h2>Versão do site</h2>
          </div>
          <p className="soft small">Escolha a aparência que os clientes veem: cores e aviso do topo mudam para a data comemorativa. Em &quot;Automático&quot; o site troca sozinho nas datas indicadas.</p>
          <div className="theme-grid" role="radiogroup" aria-label="Versão do site">
            {THEME_IDS.map((id) => {
              const t = THEMES[id];
              return (
                <button key={id} type="button" role="radio" aria-checked={theme === id} className={`theme-opt ${theme === id ? "is-active" : ""}`} onClick={() => setTheme(id)}>
                  <span className="theme-swatch" aria-hidden style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 55%, ${t.swatch[1]} 55%)` }} />
                  <span className="theme-text">
                    <strong>{t.emoji} {t.label}</strong>
                    <small>{t.hint}</small>
                  </span>
                </button>
              );
            })}
          </div>
          {theme === "auto" && <p className="hint">Hoje o site estaria no tema: <strong>{THEMES[resolveTheme("auto")].label}</strong>.</p>}
        </section>

        <section className="card panel" id="topo">
          <div className="panel-head">
            <h2>Imagens do topo do site</h2>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => file.current?.click()} disabled={uploading || slides.length >= 10}>
              {uploading ? <Loader2 className="spin" size={15} /> : <ImagePlus size={15} />} Adicionar
            </button>
          </div>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addSlides(e.target.files)} />
          {slides.length === 0 ? (
            <p className="soft small">Sem imagens, o site mostra a arte padrão da Lavena. Use imagens horizontais (formato paisagem) para um resultado melhor.</p>
          ) : (
            <ul className="slide-list">
              {slides.map((s, i) => (
                <li key={`${i}-${s.src.slice(-20)}`}>
                  <span className="slide-thumb">
                    <SmartImage src={s.src} alt={`Imagem ${i + 1}`} fill sizes="120px" style={{ objectFit: "cover" }} />
                  </span>
                  <div className="field grow">
                    <label htmlFor={`slide-${i}`}>Ao clicar, abrir</label>
                    <select id={`slide-${i}`} className="select" value={s.href} onChange={(e) => setSlides((arr) => arr.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)))}>
                      <option value="">Nada (só imagem)</option>
                      {linkOptions.map((o) => (
                        <option key={o.href} value={o.href}>
                          {o.label}
                        </option>
                      ))}
                      {s.href && !linkOptions.some((o) => o.href === s.href) && <option value={s.href}>{s.href}</option>}
                    </select>
                  </div>
                  <div className="slide-actions">
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima">
                      <ArrowUp size={16} />
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => move(i, 1)} disabled={i === slides.length - 1} aria-label="Mover para baixo">
                      <ArrowDown size={16} />
                    </button>
                    <button type="button" className="btn btn-ghost btn-icon btn-danger-text" onClick={() => setSlides((arr) => arr.filter((_, k) => k !== i))} aria-label="Remover imagem">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="form-actions">
          <span className="spacer" />
          <button type="submit" className="btn btn-primary" disabled={busy || uploading}>
            {busy ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </form>

      <form className="card panel" id="seguranca" onSubmit={submitPw} noValidate>
        <div className="panel-head">
          <h2>
            <KeyRound size={18} className="inline-icon" /> Senha do painel
          </h2>
        </div>
        {!status.passwordCustom && <p className="soft small">Você ainda usa a senha padrão. Crie uma senha só sua.</p>}
        <div className="form-row is-compact">
          <div className="field">
            <label htmlFor="pw-cur">Senha atual</label>
            <input id="pw-cur" className="input" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pw-new">Nova senha</label>
            <input id="pw-new" className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pw-new2">Repita a nova senha</label>
            <input id="pw-new2" className="input" type="password" autoComplete="new-password" value={next2} onChange={(e) => setNext2(e.target.value)} />
          </div>
        </div>
        {pwError && <p className="error-text" role="alert">{pwError}</p>}
        <div>
          <button type="submit" className="btn btn-outline" disabled={busy || !cur || !next}>
            Trocar senha
          </button>
          <p className="hint">Ao trocar, outros aparelhos conectados são desconectados.</p>
        </div>
      </form>

      <section className="card panel">
        <div className="panel-head">
          <h2>Estado do sistema</h2>
        </div>
        <ul className="status-list">
          <Status ok={status.database} label="Banco de dados" hint={status.database ? "Conectado." : "Sem conexão. Confira a variável DATABASE_URL."} />
          <Status ok={status.storage} label="Armazenamento de fotos" hint={status.storage ? "Fotos guardadas no Supabase Storage." : "Defina SUPABASE_SERVICE_ROLE_KEY. Sem ela as fotos ficam dentro do banco."} />
          <Status ok={status.passwordCustom} label="Senha personalizada" hint={status.passwordCustom ? "Senha própria definida." : "Usando a senha padrão."} />
        </ul>
        <p className="hint">Endereço do site: {status.siteUrl}</p>
      </section>
    </div>
  );
}
