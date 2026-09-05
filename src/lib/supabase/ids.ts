export function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export function asUuid(id: string | undefined | null): string | null {
  if (!id) return null;
  return isUuid(id) ? id : null;
}

export function newId() {
  return crypto.randomUUID();
}

export function remapIds(old: string, map: Map<string, string>): string {
  if (!old) return old;
  if (isUuid(old)) return old;
  const hit = map.get(old);
  if (hit) return hit;
  const next = newId();
  map.set(old, next);
  return next;
}
