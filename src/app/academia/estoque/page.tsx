"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlanGate } from "@/components/academia/plan-gate";
import { EmptyState } from "@/components/academia/empty-state";
import { FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { brl } from "@/lib/format";
import { normalizeInventoryItem } from "@/lib/academy-edit";
import { useStore } from "@/lib/store";
import type { InventoryCategory, InventoryItem } from "@/lib/types";

const CAT: Record<InventoryCategory, string> = {
  kimono: "Kimono",
  belt: "Faixa",
  apparel: "Roupa",
  gear: "Acessório",
  other: "Outro",
};

export default function EstoqueRoute() {
  return (
    <PlanGate feature="inventory">
      <EstoquePage />
    </PlanGate>
  );
}

function EstoquePage() {
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

      {store.inventory.length === 0 ? (
        <EmptyState
          title="Prateleira vazia"
          body="Cadastre kimono, faixa e tamanho. A venda no nome do aluno baixa o estoque e entra no financeiro."
        />
      ) : null}

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
              <div className="mt-3 flex flex-wrap gap-2">
                <VenderItem itemId={item.id} disabled={item.quantity < 1} />
                <EditarItem item={item} />
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    store.updateInventory(item.id, { quantity: 0 });
                    toast.message("Estoque zerado.");
                  }}
                >
                  Zerar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    store.removeInventory(item.id);
                    toast.success("Item saiu da prateleira.");
                  }}
                >
                  Tirar
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
            <NativeSelect
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {actives.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button type="submit">Baixar 1 un. no Pix</Button>
        </form>
      </FormDialog>
    </>
  );
}

function EditarItem({ item }: { item: InventoryItem }) {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [sku, setSku] = useState(item.sku);
  const [category, setCategory] = useState<InventoryCategory>(item.category);
  const [size, setSize] = useState(item.size ?? "");
  const [qty, setQty] = useState(String(item.quantity));
  const [minQty, setMinQty] = useState(String(item.minQuantity));
  const [cost, setCost] = useState(String(item.cost));
  const [price, setPrice] = useState(String(item.price));

  function sync() {
    setName(item.name);
    setSku(item.sku);
    setCategory(item.category);
    setSize(item.size ?? "");
    setQty(String(item.quantity));
    setMinQty(String(item.minQuantity));
    setCost(String(item.cost));
    setPrice(String(item.price));
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          sync();
          setOpen(true);
        }}
      >
        Editar
      </Button>
      <FormDialog open={open} onClose={() => setOpen(false)} title="Editar item">
        <InventoryForm
          name={name}
          sku={sku}
          category={category}
          size={size}
          qty={qty}
          minQty={minQty}
          cost={cost}
          price={price}
          onName={setName}
          onSku={setSku}
          onCategory={setCategory}
          onSize={setSize}
          onQty={setQty}
          onMinQty={setMinQty}
          onCost={setCost}
          onPrice={setPrice}
          submitLabel="Salvar alterações"
          onSubmit={() => {
            const next = normalizeInventoryItem({
              name,
              sku,
              category,
              size,
              quantity: qty,
              minQuantity: minQty,
              cost,
              price,
            });
            if ("error" in next) {
              toast.error(next.error);
              return false;
            }
            store.updateInventory(item.id, next);
            toast.success("Item atualizado.");
            setOpen(false);
            return true;
          }}
        />
      </FormDialog>
    </>
  );
}

function InventoryForm({
  name,
  sku,
  category,
  size,
  qty,
  minQty,
  cost,
  price,
  onName,
  onSku,
  onCategory,
  onSize,
  onQty,
  onMinQty,
  onCost,
  onPrice,
  submitLabel,
  onSubmit,
}: {
  name: string;
  sku: string;
  category: InventoryCategory;
  size: string;
  qty: string;
  minQty: string;
  cost: string;
  price: string;
  onName: (v: string) => void;
  onSku: (v: string) => void;
  onCategory: (v: InventoryCategory) => void;
  onSize: (v: string) => void;
  onQty: (v: string) => void;
  onMinQty: (v: string) => void;
  onCost: (v: string) => void;
  onPrice: (v: string) => void;
  submitLabel: string;
  onSubmit: () => boolean;
}) {
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => onName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <NativeSelect
            value={category}
            onChange={(e) => onCategory(e.target.value as InventoryCategory)}
          >
            {(Object.keys(CAT) as InventoryCategory[]).map((k) => (
              <option key={k} value={k}>
                {CAT[k]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label>Tamanho</Label>
          <Input value={size} onChange={(e) => onSize(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1.5">
          <Label>SKU</Label>
          <Input value={sku} onChange={(e) => onSku(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Qtd</Label>
          <Input value={qty} onChange={(e) => onQty(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Mínimo</Label>
          <Input value={minQty} onChange={(e) => onMinQty(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>Custo</Label>
          <Input value={cost} onChange={(e) => onCost(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Preço</Label>
          <Input value={price} onChange={(e) => onPrice(e.target.value)} />
        </div>
      </div>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

function NovoItem() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("kimono");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState("4");
  const [minQty, setMinQty] = useState("2");
  const [cost, setCost] = useState("0");
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
        <InventoryForm
          name={name}
          sku={sku}
          category={category}
          size={size}
          qty={qty}
          minQty={minQty}
          cost={cost}
          price={price}
          onName={setName}
          onSku={setSku}
          onCategory={setCategory}
          onSize={setSize}
          onQty={setQty}
          onMinQty={setMinQty}
          onCost={setCost}
          onPrice={setPrice}
          submitLabel="Salvar"
          onSubmit={() => {
            const next = normalizeInventoryItem({
              name,
              sku,
              category,
              size,
              quantity: qty,
              minQuantity: minQty,
              cost,
              price,
            });
            if ("error" in next) {
              toast.error(next.error);
              return false;
            }
            store.addInventory(next);
            toast.success("Item no estoque.");
            setOpen(false);
            setName("");
            setSku("");
            setSize("");
            return true;
          }}
        />
      </FormDialog>
    </>
  );
}
