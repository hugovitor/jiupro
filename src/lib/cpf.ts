export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string) {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function digit(slice: number[]) {
  let sum = 0;
  for (let i = 0; i < slice.length; i++) {
    sum += slice[i] * (slice.length + 1 - i);
  }
  const rest = (sum * 10) % 11;
  return rest === 10 ? 0 : rest;
}

export function isCpf(value: string) {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const nums = cpf.slice(0, 9).split("").map(Number);
  const d1 = digit(nums);
  const d2 = digit([...nums, d1]);
  return cpf === `${nums.join("")}${d1}${d2}`;
}

/** CPF válido e único para a demo (sandbox). Não use em produção. */
export function sandboxCpf(index: number) {
  const nine = String(310000000 + index).padStart(9, "0").slice(-9);
  const nums = nine.split("").map(Number);
  const d1 = digit(nums);
  const d2 = digit([...nums, d1]);
  return `${nine}${d1}${d2}`;
}
