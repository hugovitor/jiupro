"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDay, formatTime } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function AlunoMural() {
  const store = useStore();
  const [content, setContent] = useState("");

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl">Mural</h1>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!content.trim()) return;
          store.addPost(content.trim());
          setContent("");
          toast.success("No mural da academia.");
        }}
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Carona, pergunta, foto do treino…"
        />
        <Button type="submit" className="w-full">
          Compartilhar
        </Button>
      </form>
      <div className="space-y-3">
        {store.posts.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              {p.authorName}
              {p.pinned ? " · aviso da academia" : ""} · {formatDay(p.createdAt)}{" "}
              {formatTime(p.createdAt)}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{p.content}</p>
            <button
              type="button"
              className="mt-3 text-xs text-primary"
              onClick={() => store.toggleLike(p.id)}
            >
              Curtir · {p.likedBy.length}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
