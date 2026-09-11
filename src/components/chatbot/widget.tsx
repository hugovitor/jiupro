"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { answerChat } from "@/lib/chatbot/engine";
import { greeting, type ChatAudience, type ChatReply } from "@/lib/chatbot/knowledge";
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppHref } from "@/lib/support";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  links?: ChatReply["links"];
  suggestions?: string[];
  handoff?: boolean;
};

const OPEN_EVENT = "tatamex:open-chat";

export function openTatameXChat() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function audienceOf(role: string | undefined): ChatAudience {
  if (role === "student") return "student";
  if (role === "owner" || role === "instructor") return "owner";
  return "visitor";
}

function uid() {
  return `m_${Math.random().toString(36).slice(2, 10)}`;
}

export function ChatbotWidget() {
  const store = useStore();
  const pathname = usePathname();
  const audience = audienceOf(store.session?.role);
  const ctx = useMemo(
    () => ({
      audience,
      academyName: store.session ? store.academy.name : undefined,
      plan: store.session ? store.academy.plan : undefined,
    }),
    [audience, store.academy.name, store.academy.plan, store.session],
  );

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hello = greeting(ctx);
    setMessages([
      {
        id: "ola",
        role: "bot",
        text: hello.text,
        suggestions: hello.suggestions,
      },
    ]);
  }, [ctx]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  const inApp = pathname.startsWith("/academia") || pathname.startsWith("/aluno");

  if (!store.hydrated) return null;
  if (pathname.startsWith("/operacao")) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    const userMsg: ChatMessage = { id: uid(), role: "user", text: content };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    const local = answerChat(content, ctx);
    let reply: ChatReply = local;
    try {
      const history = [...messages, userMsg].slice(-8).map((item) => ({
        role: item.role === "bot" ? "assistant" : "user",
        content: item.text,
      }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          audience: ctx.audience,
          academyName: ctx.academyName,
          plan: ctx.plan,
          history,
        }),
      });
      if (response.ok) {
        const json = (await response.json()) as ChatReply;
        if (json?.text) reply = { ...local, ...json, id: json.id || local.id };
      }
    } catch {
      reply = local;
    }

    await new Promise((resolve) => setTimeout(resolve, 280));
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "bot",
        text: reply.text,
        links: reply.links,
        suggestions: reply.suggestions,
        handoff: reply.handoff,
      },
    ]);
    setBusy(false);
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 z-[80]",
        pathname.startsWith("/aluno")
          ? "bottom-[5.5rem]"
          : inApp
            ? "bottom-[5.5rem] lg:bottom-6"
            : "bottom-6",
      )}
    >
      {open ? (
        <div className="pointer-events-auto mb-3 flex h-[min(70vh,32rem)] w-[min(calc(100vw-2rem),22.5rem)] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <header className="flex items-center justify-between border-b border-white/10 bg-[#111] px-4 py-3">
            <div>
              <p className="text-[10px] font-black tracking-[0.18em] text-red-500 uppercase">
                Assistente
              </p>
              <p className="text-sm font-black">Responde sozinho</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white/50 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
            >
              <X className="size-4" />
            </Button>
          </header>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((item) => (
              <div key={item.id} className={cn("flex", item.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-5",
                    item.role === "user"
                      ? "bg-red-600 text-white"
                      : "border border-white/10 bg-white/[0.04] text-white/90",
                  )}
                >
                  <p className="whitespace-pre-wrap">{item.text}</p>
                  {item.links?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold hover:bg-red-600"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {item.handoff ? (
                    <a
                      href={supportWhatsAppHref(
                        ctx.academyName
                          ? `Olá, sou de ${ctx.academyName} no TatameX.`
                          : undefined,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold"
                    >
                      WhatsApp {SUPPORT_PHONE_DISPLAY}
                    </a>
                  ) : null}
                  {item.suggestions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.suggestions.map((hint) => (
                        <button
                          key={hint}
                          type="button"
                          className="rounded-lg border border-white/15 px-2 py-1 text-left text-[11px] text-white/70 hover:border-red-500 hover:text-white"
                          onClick={() => void send(hint)}
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {busy ? (
              <p className="text-[11px] text-white/35">Escrevendo…</p>
            ) : null}
          </div>

          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre o TatameX"
              className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-500"
              maxLength={500}
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Enviar">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className="pointer-events-auto flex size-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-950/40 hover:bg-red-500"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
}
