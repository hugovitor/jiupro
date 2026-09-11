"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { AcademyMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readBrandLogo } from "@/lib/academy-brand";
import { hasFeature } from "@/lib/plan-access";
import { useStore } from "@/lib/store";
import Link from "next/link";

export function AcademyBrandEditor() {
  const store = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const allowed = hasFeature(store.academy, "academyBrand");

  if (!allowed) {
    return (
      <section className="border border-border bg-card p-5">
        <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
          Plano Equipe
        </p>
        <h2 className="mt-2 font-medium">Marca da academia no app</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No Equipe o aluno abre o app da sua casa: logo, nome da equipe e atalho na tela
          inicial. Nos outros planos o topo continua TatameX.
        </p>
        <Button className="mt-4" render={<Link href="/planos" />}>
          Ver o Equipe
        </Button>
      </section>
    );
  }

  return (
    <section className="border border-border bg-card p-5">
      <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
        App dos alunos
      </p>
      <h2 className="mt-2 font-medium">Marca da academia</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        É o que o aluno vê no topo, no atalho da tela inicial e na aba do navegador.
      </p>

      <div className="mt-4 rounded-2xl border border-white/10 bg-[#080808] p-4">
        <p className="mb-3 text-[10px] font-black tracking-[0.16em] text-white/35 uppercase">
          Preview do app
        </p>
        <AcademyMark
          name={store.academy.name}
          logo={store.academy.brandLogo}
          tagline={store.academy.brandTagline}
        />
      </div>

      <div className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="brand-tagline">Linha de baixo</Label>
          <Input
            id="brand-tagline"
            value={store.academy.brandTagline}
            onChange={(e) => store.updateAcademy({ brandTagline: e.target.value.slice(0, 32) })}
            placeholder="Jiu-Jitsu"
            maxLength={32}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              const logo = await readBrandLogo(file);
              store.updateAcademy({ brandLogo: logo });
              toast.success("Logo no app dos alunos.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Não deu para ler o logo.");
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => fileRef.current?.click()}>
            {store.academy.brandLogo ? "Trocar logo" : "Enviar logo"}
          </Button>
          {store.academy.brandLogo ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                store.updateAcademy({ brandLogo: "" });
                toast.message("Voltou para as iniciais.");
              }}
            >
              Usar iniciais
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
