"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { InventoryCategory } from "@/lib/types";

const CAT: Record<InventoryCategory, string> = {
  kimono: "Kimono",
  belt: "Faixa",
  apparel: "Roupa",
  gear: "Acessório",
  other: "Outro",
};

export default function EstoquePage() {
  const store = useStore();
  const sales = [...(store.sales ?? [])].slice(0, 8);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prateleira, venda no nome do aluno, o que já deveria ter sido pedido.
          </p>
        </div>
        <NovoItem />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {store.inventory.map((item) => {
          const low = item.quantity <= item.minQuantity;
          return (
            <article
              key={item.id}
              className={`border bg-card p-4 ${
                low ? "border-destructive/50" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {item.name}
                    {item.size ? ` · ${item.size}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {CAT[item.category]} · {item.sku}
                  </p>
                </div>
                <span className={low ? "text-destructive" : ""}>
                  {item.quantity} un.
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Custo {brl(item.cost)} · venda {brl(item.price)}
              </p>
              <div className="mt-3 flex gap-2">
                <VenderItem itemId={item.id} disabled={item.quantity < 1} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    store.adjustStock(item.id, 5);
                    toast.success("Entrada de 5 unidades.");
                  }}
                >
                  +5 compra
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <section>
        <h2 className="mb-2 font-display text-xl">Últimas vendas</h2>
        {sales.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma venda ainda.</p>
        )}
        <div className="space-y-2">
          {sales.map((sale) => {
            const s = store.students.find((st) => st.id === sale.studentId);
            return (
              <div
                key={sale.id}
                className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  {sale.itemName} · {s?.name ?? "aluno"}
                </span>
                <span>{brl(sale.amount)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function VenderItem({ itemId, disabled }: { itemId: string; disabled?: boolean }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState(
    store.students.find((s) => s.status === "active")?.id ?? "",
  );
  const actives = store.students.filter((s) => s.status !== "inactive");

  return (
    <>
      <Button
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Vender
      </Button>
      <FormDialog open={open} onClose={() => setOpen(false)} title="Venda da loja">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!studentId) return;
            const ok = store.sellItem(studentId, itemId, 1, "pix");
            if (!ok) {
              toast.error("Sem estoque.");
              return;
            }
            toast.success("Venda lançada no Pix.");
            setOpen(false);
          }}
        >
          <div className="space-y-1.5">
            <Label>Aluno</Label>
            <select
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {actives.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit">Baixar 1 un. no Pix</Button>
        </form>
      </FormDialog>
    </>
  );
}

function NovoItem() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [qty, setQty] = useState("4");
  const [price, setPrice] = useState("100");

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Novo item
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Entrada no estoque"
      >
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            store.addInventory({
              name: name.trim(),
              sku: sku || name.slice(0, 6).toUpperCase(),
              category: "other",
              quantity: Number(qty) || 0,
              minQuantity: 2,
              cost: 0,
              price: Number(price) || 0,
            });
            toast.success("Item no estoque.");
            setOpen(false);
            setName("");
            setSku("");
          }}
        >
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Qtd</Label>
              <Input value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Preço</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </FormDialog>
    </>
  );
}
