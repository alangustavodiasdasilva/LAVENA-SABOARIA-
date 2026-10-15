"use client";

import { useRef, useState } from "react";
import { Crop, ImagePlus, Loader2, Star, X } from "lucide-react";
import ImageAdjuster, { type AspectKey } from "@/components/admin/image-adjuster";
import { uploadImage } from "@/actions/upload";
import { useToast } from "@/components/ui/toast";
import SmartImage from "@/components/ui/smart-image";

/** Reduz a foto no navegador antes de enviar (fotos de celular passam de 5 MB). */
async function compress(file: File, max = 1600): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/heic" || file.type === "image/heif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

export function useImageUpload() {
  const toast = useToast();
  const [uploading, setUploading] = useState(0);

  const upload = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    setUploading((n) => n + files.length);
    for (const f of files) {
      try {
        const small = await compress(f);
        const fd = new FormData();
        fd.set("file", small);
        const res = await uploadImage(fd);
        if (res.ok) urls.push(res.data);
        else toast.error(res.error);
      } catch {
        toast.error("Falha ao enviar a imagem. Verifique a internet e tente de novo.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
    return urls;
  };
  return { upload, uploading: uploading > 0 };
}

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Uma imagem só (variação, sacola, kit, seção de presentes). Ao escolher o arquivo abre o ajuste com prévia. */
export function SingleImage({
  value,
  onChange,
  label = "Foto",
  aspect = "sq",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: AspectKey;
}) {
  const { upload, uploading } = useImageUpload();
  const input = useRef<HTMLInputElement>(null);
  const [adjust, setAdjust] = useState<{ src: string; original: File | null } | null>(null);

  const pick = (files: FileList | null) => {
    const f = files?.[0];
    if (input.current) input.current.value = "";
    if (f) setAdjust({ src: URL.createObjectURL(f), original: f });
  };
  const send = async (file: File) => {
    setAdjust(null);
    const [url] = await upload([file]);
    if (url) onChange(url);
  };

  return (
    <div className="single-img">
      <button type="button" className={`img-slot ${value ? "has-img" : ""}`} onClick={() => input.current?.click()} disabled={uploading} aria-label={value ? `Trocar ${label.toLowerCase()}` : `Enviar ${label.toLowerCase()}`}>
        {value ? <SmartImage src={value} alt="" fill sizes="120px" style={{ objectFit: "cover" }} /> : uploading ? <Loader2 className="spin" size={22} /> : <ImagePlus size={22} />}
        {!value && !uploading && <span>{label}</span>}
        {value && uploading && (
          <span className="img-busy">
            <Loader2 className="spin" size={22} />
          </span>
        )}
      </button>
      {value && (
        <>
          <button type="button" className="img-remove" onClick={() => onChange(null)} aria-label="Remover foto">
            <X size={14} />
          </button>
          <button type="button" className="img-adjust" onClick={() => setAdjust({ src: value, original: null })} aria-label="Ajustar foto" title="Ajustar foto">
            <Crop size={14} />
          </button>
        </>
      )}
      <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files)} />
      {adjust && (
        <ImageAdjuster
          src={adjust.src}
          initialAspect={aspect}
          onClose={() => setAdjust(null)}
          onApply={send}
          onSkip={adjust.original ? () => send(adjust.original as File) : undefined}
        />
      )}
    </div>
  );
}

/** Galeria: a primeira foto é a capa. */
export function GalleryUploader({ value, onChange, max = 12, aspect = "port" }: { value: string[]; onChange: (urls: string[]) => void; max?: number; aspect?: AspectKey }) {
  const { upload, uploading } = useImageUpload();
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - value.length;
    if (room <= 0) return toast.error(`Use no máximo ${max} fotos.`);
    const list = Array.from(files).slice(0, room);
    const urls = await upload(list);
    if (urls.length) onChange([...value, ...urls]);
    if (input.current) input.current.value = "";
  };

  const makeCover = (i: number) => onChange([value[i], ...value.filter((_, x) => x !== i)]);
  const [adjustIdx, setAdjustIdx] = useState<number | null>(null);
  const applyAdjust = async (file: File) => {
    const i = adjustIdx;
    setAdjustIdx(null);
    if (i == null) return;
    const [url] = await upload([file]);
    if (url) onChange(value.map((v, x) => (x === i ? url : v)));
  };

  return (
    <div className="gallery-up">
      {value.map((src, i) => (
        <div key={`${i}-${src.slice(-24)}`} className={`thumb ${i === 0 ? "is-cover" : ""}`}>
          <SmartImage src={src} alt={`Foto ${i + 1}`} fill sizes="120px" style={{ objectFit: "cover" }} />
          {i === 0 && <span className="cover-tag">Capa</span>}
          <div className="thumb-actions">
            <button type="button" onClick={() => setAdjustIdx(i)} aria-label="Ajustar foto" title="Ajustar foto">
              <Crop size={14} />
            </button>
            {i !== 0 && (
              <button type="button" onClick={() => makeCover(i)} aria-label="Usar como capa" title="Usar como capa">
                <Star size={14} />
              </button>
            )}
            <button type="button" onClick={() => onChange(value.filter((_, x) => x !== i))} aria-label="Remover foto" title="Remover">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
      {value.length < max && (
        <button type="button" className="img-slot add" onClick={() => input.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="spin" size={22} /> : <ImagePlus size={22} />}
          <span>{uploading ? "Enviando…" : "Adicionar fotos"}</span>
        </button>
      )}
      <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => pick(e.target.files)} />
      {adjustIdx != null && value[adjustIdx] && <ImageAdjuster src={value[adjustIdx]} initialAspect={aspect} onClose={() => setAdjustIdx(null)} onApply={applyAdjust} />}
    </div>
  );
}
