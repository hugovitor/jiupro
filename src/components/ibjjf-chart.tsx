import { BeltStrip } from "@/components/belt-badge";
import { ADULT_BELTS, KIDS_BELTS, beltAgeHint } from "@/lib/belts";

export function IbjjfChart() {
  return (
    <section className="border border-border bg-card p-5">
      <h2 className="font-display text-xl uppercase">Quadro IBJJF</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sistema geral de graduação. Kids 4–15 anos: faixa do grupo com listra
        branca, lisa ou listra preta no centro. Aos 16, cinza/amarela/laranja
        viram azul; verde pode ir para azul ou roxa. Tempos oficiais valem para
        o reconhecimento da federação — a promoção no tatame continua sua.
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            4 a 15 anos · 13 faixas
          </p>
          <ul className="mt-3 space-y-2">
            {KIDS_BELTS.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm">{b.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {beltAgeHint(b)}
                    {b.maxDegrees ? " · até 4 graus" : ""}
                  </span>
                </span>
                <BeltStrip belt={b.id} stripes={b.id === "white" ? 0 : 2} className="h-4 w-28" />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            16 anos ou mais
          </p>
          <ul className="mt-3 space-y-2">
            {ADULT_BELTS.map((b) => (
              <li key={`a-${b.id}`} className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm">{b.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {beltAgeHint(b)}
                    {b.id === "black"
                      ? " · até 6 graus"
                      : b.maxDegrees
                        ? " · até 4 graus"
                        : b.id === "coral_red_black"
                          ? " · 7º grau"
                          : b.id === "coral_red_white"
                            ? " · 8º grau"
                            : b.id === "red"
                              ? " · 9º/10º grau"
                              : ""}
                  </span>
                </span>
                <BeltStrip
                  belt={b.id}
                  stripes={b.id === "black" ? 3 : b.maxDegrees ? 2 : 0}
                  className="h-4 w-28"
                />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Adulto 18+: azul 2 anos, roxa 1½ ano, marrom 1 ano. Branca sem
            mínimo da IBJJF. Preta: 31 anos até a coral. Juvenil 16–17: azul e
            branca sem mínimo; marrom só a partir de 18.
          </p>
        </div>
      </div>
    </section>
  );
}
