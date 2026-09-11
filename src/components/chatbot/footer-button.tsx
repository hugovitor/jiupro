"use client";

export function ChatFooterButton() {
  return (
    <button
      type="button"
      className="hover:text-white"
      onClick={() => window.dispatchEvent(new Event("tatamex:open-chat"))}
    >
      Assistente (responde sozinho)
    </button>
  );
}
