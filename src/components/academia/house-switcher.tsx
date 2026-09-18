"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { canCreateAnotherHouse, roleLabel, routeForRole } from "@/lib/memberships";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function HouseSwitcher({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const store = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const houses = store.houses ?? [];
  if (houses.length < 2) return null;

  async function onChange(academyId: string) {
    if (!academyId || academyId === store.academy.id || busy) return;
    setBusy(true);
    const result = await store.switchHouse(academyId);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Unidade trocada.");
    router.push(routeForRole(result.role));
  }

  return (
    <label className={cn("block min-w-0", className)}>
      <span className="sr-only">Unidade</span>
      <NativeSelect
        value={store.academy.id}
        disabled={busy}
        aria-label="Trocar de unidade"
        onChange={(event) => void onChange(event.target.value)}
        className={compact ? "h-8 max-w-[12rem] text-[12px]" : "max-w-[16rem]"}
      >
        {houses.map((house) => (
          <option key={house.id} value={house.id}>
            {house.name} · {roleLabel(house.role)}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}

export function OpenAnotherHouseForm() {
  const store = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);

  if (store.isDemo || !canCreateAnotherHouse(store.session?.role, store.houses)) {
    return null;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !city.trim()) {
      toast.error("Informe o nome e a cidade da nova unidade.");
      return;
    }
    setBusy(true);
    const result = await store.openAnotherHouse({ name, city });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${name.trim()} aberta neste login.`);
    setName("");
    setCity("");
    router.push("/academia");
  }

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-medium">Outra unidade</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Mesmo e-mail, outra academia. Cada unidade tem alunos, Pix e plano próprios. Use o seletor
        no topo para trocar.
      </p>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void submit(event)}>
        <div className="space-y-1.5">
          <Label htmlFor="unit-name">Nome da unidade</Label>
          <Input
            id="unit-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex: Asa Norte"
            autoComplete="organization"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit-city">Cidade</Label>
          <Input
            id="unit-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Brasília, DF"
            autoComplete="address-level2"
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Abrindo…" : "Abrir outra unidade"}
          </Button>
        </div>
      </form>
    </section>
  );
}
