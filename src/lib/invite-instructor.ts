import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureBrowserAuthSession } from "@/lib/supabase/session";

export type InstructorInviteInput = {
  name: string;
  email: string;
  phone: string;
};

export type InstructorInviteOk = {
  ok: true;
  linked?: boolean;
  message?: string;
  phone: string;
  userId?: string;
};

export type InstructorInviteResult = InstructorInviteOk | { ok: false; error: string };

export async function submitInstructorInvite(
  store: {
    isDemo: boolean;
    addInstructor: (input: { id?: string; name: string; email: string; phone: string }) => void;
  },
  input: InstructorInviteInput,
): Promise<InstructorInviteResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (!name || !email.includes("@")) {
    return { ok: false, error: "Nome e e-mail do professor." };
  }

  if (store.isDemo || !createSupabaseBrowserClient()) {
    store.addInstructor({ name, email, phone });
    return { ok: true, phone };
  }

  const client = createSupabaseBrowserClient();
  const token = client ? await ensureBrowserAuthSession(client) : null;
  if (!token) return { ok: false, error: "Entre de novo para convidar." };

  const res = await fetch("/api/academia/equipe", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, phone }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    userId?: string;
    message?: string;
    phone?: string;
    linked?: boolean;
  };
  if (!res.ok) {
    return { ok: false, error: data.error || "Não convidou agora." };
  }
  store.addInstructor({ id: data.userId, name, email, phone });
  return {
    ok: true,
    linked: data.linked,
    message: data.message,
    phone: data.phone || phone,
    userId: data.userId,
  };
}
