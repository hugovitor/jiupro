import { describe, expect, it } from "vitest";
import {
  medicalLabel,
  medicalNeedsAttention,
  medicalSortRank,
  medicalStatus,
} from "./medical-certificate";

describe("atestado médico", () => {
  it("marca falta, vencido, vencendo e em dia", () => {
    const today = "2026-09-21";
    expect(medicalStatus(undefined, today)).toBe("missing");
    expect(medicalStatus("", today)).toBe("missing");
    expect(medicalStatus("2026-09-20", today)).toBe("expired");
    expect(medicalStatus("2026-10-05", today)).toBe("expiring");
    expect(medicalStatus("2027-01-01", today)).toBe("ok");
    expect(medicalNeedsAttention("2026-09-01", today)).toBe(true);
    expect(medicalNeedsAttention("2027-01-01", today)).toBe(false);
    expect(medicalLabel("2026-09-01", today)).toBe("Atestado vencido");
    expect(medicalSortRank("2026-09-01", today)).toBeLessThan(
      medicalSortRank(undefined, today),
    );
  });
});
