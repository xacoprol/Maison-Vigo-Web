"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  CARE_ASSIST_CHIPS,
  CARE_ASSIST_MAX_MESSAGE_CHARS,
  CARE_ASSIST_MAX_USER_MESSAGES,
  type CareAssistMessage,
} from "@/lib/care-assist";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";

import "./care-assist.css";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  serviceHref?: string | null;
  serviceTitle?: string | null;
  suggestBooking?: boolean;
};

type AssistApiOk = {
  reply: string;
  serviceSlug: string | null;
  serviceTitle: string | null;
  serviceHref: string | null;
  suggestBooking: boolean;
};

type AssistApiErr = { error: string };

const WELCOME: UiMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Cuéntame qué necesita tu perro y te oriento hacia el cuidado que mejor encaja. Sin prisas.",
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CareAssist() {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME]);
  const userTurns = messages.filter((m) => m.role === "user").length;
  const limitReached = userTurns >= CARE_ASSIST_MAX_USER_MESSAGES;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open, messages, pending, scrollToBottom]);

  useEffect(() => {
    if (!open) return;

    lockScroll();
    document.body.classList.add("care-assist-open");
    document.documentElement.classList.add("care-assist-open");

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("care-assist-open");
      document.documentElement.classList.remove("care-assist-open");
      unlockScroll();
    };
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, CARE_ASSIST_MAX_MESSAGE_CHARS);
      if (!trimmed || pending || limitReached) return;

      setError(null);
      setInput("");
      const userMessage: UiMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
      };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setPending(true);

      const history: CareAssistMessage[] = nextMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch("/api/assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const data = (await res.json()) as AssistApiOk | AssistApiErr;

        if (!res.ok || "error" in data) {
          const msg =
            "error" in data && data.error
              ? data.error
              : "No pude responder ahora. Prueba de nuevo o reserva cita.";
          setError(msg);
          setMessages((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              content: msg,
              suggestBooking: true,
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: data.reply,
            serviceHref: data.serviceHref,
            serviceTitle: data.serviceTitle,
            suggestBooking: data.suggestBooking,
          },
        ]);
      } catch {
        const msg =
          "No pude conectar ahora. Reserva cita o escríbenos por WhatsApp.";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: msg,
            suggestBooking: true,
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [limitReached, messages, pending],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      <button
        type="button"
        className={`care-assist-fab${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-controls="care-assist-panel"
        aria-label={open ? "Cerrar orientación" : "Abrir orientación de cuidado"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="care-assist-fab-label" aria-hidden={true}>
          {open ? "Cerrar" : "Orientar"}
        </span>
      </button>

      <div
        className={`care-assist-backdrop${open ? " is-open" : ""}`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      <div
        ref={panelRef}
        id="care-assist-panel"
        className={`care-assist-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!open}
      >
        <header className="care-assist-header">
          <div className="care-assist-header-copy">
            <p className="care-assist-eyebrow">Maison Vigo</p>
            <h2 id={titleId} className="care-assist-title">
              Orientación de cuidado
            </h2>
          </div>
          <button
            type="button"
            className="care-assist-close"
            aria-label="Cerrar orientación"
            onClick={() => setOpen(false)}
          >
            <svg width="22" height="22" viewBox="0 0 30 30" aria-hidden={true}>
              <path
                d="M9 9L21 21M21 9L9 21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div ref={listRef} className="care-assist-messages" tabIndex={0}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`care-assist-bubble care-assist-bubble--${message.role}`}
            >
              <p>{message.content}</p>
              {(message.serviceHref || message.suggestBooking) && (
                <div className="care-assist-actions">
                  {message.serviceHref && message.serviceTitle ? (
                    <Link
                      href={message.serviceHref}
                      className="care-assist-action"
                      onClick={() => setOpen(false)}
                    >
                      Ver {message.serviceTitle}
                    </Link>
                  ) : null}
                  {message.suggestBooking ? (
                    <a
                      href="/#contacto"
                      className="care-assist-action care-assist-action--gold js-open-reserva-panel"
                      onClick={() => setOpen(false)}
                    >
                      Reservar cita
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          ))}
          {pending ? (
            <div
              className="care-assist-bubble care-assist-bubble--assistant care-assist-bubble--pending"
              aria-live="polite"
            >
              <span className="care-assist-pending-dot" />
              <span className="care-assist-pending-dot" />
              <span className="care-assist-pending-dot" />
            </div>
          ) : null}
        </div>

        {!limitReached ? (
          <div className="care-assist-chips" role="list">
            {CARE_ASSIST_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="care-assist-chip"
                role="listitem"
                disabled={pending}
                onClick={() => void sendMessage(chip.prompt)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="care-assist-limit">
            Hemos llegado al final de esta orientación. Reserva cita o
            escríbenos si quieres seguir.
          </p>
        )}

        <form className="care-assist-form" onSubmit={onSubmit}>
          <label className="visually-hidden" htmlFor="care-assist-input">
            Escribe qué necesita tu perro
          </label>
          <textarea
            ref={inputRef}
            id="care-assist-input"
            className="care-assist-input"
            rows={2}
            maxLength={CARE_ASSIST_MAX_MESSAGE_CHARS}
            placeholder="Ej. tiene el pelo muy enredado…"
            value={input}
            disabled={pending || limitReached}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
          />
          <button
            type="submit"
            className="care-assist-send"
            disabled={pending || limitReached || !input.trim()}
          >
            Enviar
          </button>
        </form>

        {error ? (
          <p className="care-assist-error" role="status">
            {error}
          </p>
        ) : null}
      </div>
    </>
  );
}
