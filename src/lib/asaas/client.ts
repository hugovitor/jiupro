import { digitsOnly } from "@/lib/cpf";
import {
  asaasBaseUrl,
  asaasEnvironmentFromKey,
  type AsaasEnvironment,
} from "./env";

type AsaasErrorBody = {
  errors?: { code?: string; description?: string }[];
};

export type AsaasCustomer = {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
};

export type AsaasPayment = {
  id: string;
  status: string;
  value: number;
  dueDate?: string;
  invoiceUrl?: string;
  billingType?: string;
  externalReference?: string | null;
  customer?: string;
};

export type AsaasPixQr = {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
};

export class AsaasApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export function createAsaasClient(apiKey: string) {
  const key = apiKey.trim();
  const env: AsaasEnvironment = asaasEnvironmentFromKey(key);
  const base = asaasBaseUrl(env);

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": `Ponteira/0.1 (Next.js; ${env})`,
        access_token: key,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => ({}))) as AsaasErrorBody & T;
    if (!res.ok) {
      const first = body.errors?.[0];
      throw new AsaasApiError(
        first?.description || `Asaas ${res.status}`,
        res.status,
        first?.code,
      );
    }
    return body as T;
  }

  return {
    env,
    async account() {
      try {
        return await request<{ name?: string; email?: string; walletId?: string }>(
          "/myAccount",
        );
      } catch {
        await request<{ data?: unknown[] }>("/customers?limit=1");
        return { name: "Asaas", email: undefined };
      }
    },
    async findCustomer(externalReference: string) {
      const data = await request<{ data?: AsaasCustomer[] }>(
        `/customers?externalReference=${encodeURIComponent(externalReference)}&limit=1`,
      );
      return data.data?.[0] ?? null;
    },
    async createCustomer(input: {
      name: string;
      cpfCnpj: string;
      email?: string;
      mobilePhone?: string;
      externalReference: string;
    }) {
      return request<AsaasCustomer>("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          cpfCnpj: digitsOnly(input.cpfCnpj),
          email: input.email || undefined,
          mobilePhone: digitsOnly(input.mobilePhone ?? "").slice(-11) || undefined,
          externalReference: input.externalReference,
          notificationDisabled: false,
        }),
      });
    },
    async createPixCharge(input: {
      customer: string;
      value: number;
      dueDate: string;
      description: string;
      externalReference: string;
    }) {
      return request<AsaasPayment>("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: input.customer,
          billingType: "PIX",
          value: input.value,
          dueDate: input.dueDate,
          description: input.description.slice(0, 500),
          externalReference: input.externalReference,
        }),
      });
    },
    async getPayment(id: string) {
      return request<AsaasPayment>(`/payments/${encodeURIComponent(id)}`);
    },
    async pixQrCode(id: string) {
      return request<AsaasPixQr>(`/payments/${encodeURIComponent(id)}/pixQrCode`);
    },
  };
}

export function asaasPaid(status: string) {
  return status === "RECEIVED" || status === "CONFIRMED" || status === "RECEIVED_IN_CASH";
}
