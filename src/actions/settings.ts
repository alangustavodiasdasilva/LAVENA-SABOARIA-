"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { adminAction } from "@/lib/auth";
import { UserError, parseInput } from "@/lib/action";
import { normalizeWhatsapp } from "@/lib/format";
import { normalizeInstagram, settingsSchema, type SettingsInput } from "@/lib/schemas";

export async function saveSettings(input: SettingsInput) {
  return adminAction("saveSettings", async () => {
    const d = parseInput(settingsSchema, input);

    const rawPhone = (d.whatsappNumber || "").trim();
    let whatsappNumber: string | null = null;
    if (rawPhone) {
      whatsappNumber = normalizeWhatsapp(rawPhone);
      if (!whatsappNumber) throw new UserError("WhatsApp inválido. Informe DDD + número, ex.: (11) 99999-8888.");
    }

    const rawInsta = (d.instagramUrl || "").trim();
    const instagramUrl = normalizeInstagram(rawInsta);
    if (rawInsta && !instagramUrl) throw new UserError("Instagram inválido. Use @usuario ou o link do perfil.");

    const data = {
      whatsappNumber,
      instagramUrl,
      announcement: d.announcement,
      deliveryInfo: d.deliveryInfo,
      heroImages: d.heroSlides.map((s) => s.src),
      heroImageLinks: d.heroSlides.map((s) => s.href),
      // a galeria nova substitui a "logo padrão" antiga
      heroImageUrl: null,
      heroImageUrlLink: null,
    };
    await prisma.settings.upsert({ where: { id: "default" }, create: { id: "default", ...data }, update: data });
    revalidatePath("/", "layout");
  });
}
