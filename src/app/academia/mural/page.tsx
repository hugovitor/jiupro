"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function MuralPage() {
  const store = useStore();
  const [content, setContent] = useState("");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl">Mural</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Avisos da casa e conversa da equipe. O aluno vê a mesma timeline no PWA.
        </p>
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!content.trim()) return;
          store.addPost(content.trim());
          setContent("");
          toast.success("No mural.");
        }}
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Seminário, mudança de horário, resultado do campeonato…"
        />
        <Button type="submit">Publicar</Button>
      </form>

      <div className="space-y-3">
        {store.posts.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {p.authorName}
                {p.authorRole === "owner"
                  ? " · academia"
                  : p.authorRole === "instructor"
                    ? " · professor"
                    : ""}
                {p.pinned ? " · fixado" : ""}
              </span>
              <span>
                {formatDate(p.createdAt)} · {formatTime(p.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{p.content}</p>
            <button
              type="button"
              className="mt-3 text-xs text-muted-foreground hover:text-primary"
              onClick={() => store.toggleLike(p.id)}
            >
              {p.likedBy.length} curtiram
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
