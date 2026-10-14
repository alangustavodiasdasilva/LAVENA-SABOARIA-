"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { Leaf } from "lucide-react";

type Props = Omit<ImageProps, "src" | "alt"> & { src?: string | null; alt: string };

/**
 * next/image que não quebra: aceita data URL, hosts externos (sem otimização)
 * e mostra um placeholder se a imagem faltar ou falhar.
 */
export default function SmartImage({ src, alt, ...rest }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <div className="img-placeholder" role="img" aria-label={alt}>
        <Leaf size={30} strokeWidth={1.25} />
      </div>
    );
  }
  const optimizable = src.startsWith("/") || /^https:\/\/[^/]+\.supabase\.co\//.test(src);
  return <Image src={src} alt={alt} unoptimized={!optimizable} onError={() => setFailed(src)} {...rest} />;
}
