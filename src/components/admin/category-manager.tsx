"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { createCategory, deleteCategory, renameCategory } from "@/actions/catalog";
import { EmptyBlock } from "@/components/admin/ui";
import { useRun } from "@/components/admin/use-run";
import { useConfirm } from "@/components/ui/confirm";
import type { AdminCategoryDTO } from "@/lib/admin-types";

export default function CategoryManager({ categories }: { categories: AdminCategoryDTO[] }) {
  const { run, busy } = useRun();
  const confirm = useConfirm();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await run(() => createCategory(name), { success: "Categoria criada.", onDone: () => setName("") });
  };

  const save = async (id: string) => {
    const ok = await run(() => renameCategory(id, draft), { success: "Categoria renomeada." });
    if (ok) setEditing(null);
  };

  const remove = async (c: AdminCategoryDTO) => {
    const ok = await confirm({ title: `Excluir “${c.name}”?`, message: "Só é possível excluir categorias sem produtos.", confirmLabel: "Excluir", tone: "danger" });
    if (ok) await run(() => deleteCategory(c.id), { success: "Categoria excluída." });
  };

  return (
    <div className="stack">
      <form className="card panel inline-add" onSubmit={add}>
        <label htmlFor="new-cat" className="sr-only">
          Nome da nova categoria
        </label>
        <input id="new-cat" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria, ex.: Sabonetes" maxLength={60} />
        <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
          <Plus size={17} /> Criar
        </button>
      </form>

      {categories.length === 0 ? (
        <EmptyBlock icon={<Tags size={26} />} title="Nenhuma categoria ainda">
          Sugestões: Sabonetes, Sabonete líquido, Geleia de banho, Mousse de banho.
        </EmptyBlock>
      ) : (
        <ul className="card simple-list">
          {categories.map((c) => (
            <li key={c.id}>
              {editing === c.id ? (
                <form
                  className="inline-add grow"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save(c.id);
                  }}
                >
                  <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={60} autoFocus aria-label="Novo nome" />
                  <button type="submit" className="btn btn-primary btn-icon" disabled={busy} aria-label="Salvar">
                    <Check size={17} />
                  </button>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => setEditing(null)} aria-label="Cancelar">
                    <X size={17} />
                  </button>
                </form>
              ) : (
                <>
                  <div className="grow">
                    <strong>{c.name}</strong>
                    <small>
                      {c.productCount} {c.productCount === 1 ? "produto" : "produtos"}
                    </small>
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => { setEditing(c.id); setDraft(c.name); }} aria-label={`Renomear ${c.name}`}>
                    <Pencil size={17} />
                  </button>
                  <button type="button" className="btn btn-ghost btn-icon btn-danger-text" onClick={() => remove(c)} disabled={busy} aria-label={`Excluir ${c.name}`}>
                    <Trash2 size={17} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
