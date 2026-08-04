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
  CARE_ASSIST_OPEN_EVENT,
  type CareAssistMessage,
  type CareAssistOpenDetail,
} from "@/lib/care-assist";

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
  const pendingPromptRef = useRef<string | null>(null);
  const sendMessageRef = useRef<(text: string) => Promise<void>>(
    async () => {},
  );
  const userTurns = messages.filter((m) => m.role === "user").length;
  const limitReached = userTurns >= CARE_ASSIST_MAX_USER_MESSAGES;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  /** Apertura desde el menú u otros puntos del sitio. */
  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<CareAssistOpenDetail>).detail;
      const prompt = detail?.prompt?.trim();
      if (prompt) pendingPromptRef.current = prompt;
      setOpen(true);
    };
    document.body.addEventListener(CARE_ASSIST_OPEN_EVENT, onOpen);
    return () => {
      document.body.removeEventListener(CARE_ASSIST_OPEN_EVENT, onOpen);
    };
  }, []);

  /** Solo al abrir: no re-enfocar en cada mensaje (rompe el teclado en iOS). */
  useEffect(() => {
    if (!open) return;
    scrollToBottom();

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (coarse) return;

    const t = window.setTimeout(() => inputRef.current?.focus(), 240);
    return () => window.clearTimeout(t);
  }, [open, scrollToBottom]);

  /** Chip del menú: envía el prompt al terminar de abrir el panel. */
  useEffect(() => {
    if (!open) return;
    const prompt = pendingPromptRef.current;
    if (!prompt) return;
    pendingPromptRef.current = null;
    const t = window.setTimeout(() => {
      void sendMessageRef.current(prompt);
    }, 280);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [messages, pending, open, scrollToBottom]);

  /**
   * Bloqueo suave: sin `position: fixed` en body (eso congela el input en iOS).
   * Paramos Lenis y evitamos scroll del documento fuera del panel.
   */
  useEffect(() => {
    if (!open) return;

    const lenis = window.__mvLenis;
    lenis?.stop();

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.classList.add("care-assist-open");
    html.classList.add("care-assist-open");

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const onTouchMove = (event: TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const panel = panelRef.current;
      if (panel?.contains(target)) return;
      event.preventDefault();
    };

    /**
     * Teclado móvil: anclar el sheet al visualViewport para que no
     * “salte” todo hacia arriba al enfocar el input.
     */
    const vv = window.visualViewport;
    const syncKeyboardLayout = () => {
      const panel = panelRef.current;
      if (!panel) return;

      if (!vv) {
        panel.style.removeProperty("--care-assist-kb-inset");
        panel.style.removeProperty("--care-assist-vv-h");
        return;
      }

      const insetBottom = Math.max(
        0,
        window.innerHeight - (vv.height + vv.offsetTop),
      );
      panel.style.setProperty("--care-assist-kb-inset", `${insetBottom}px`);
      panel.style.setProperty(
        "--care-assist-vv-h",
        `${Math.round(vv.height)}px`,
      );

      /* iOS a veces desplaza el layout al enfocar; lo devolvemos. */
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };

    syncKeyboardLayout();
    vv?.addEventListener("resize", syncKeyboardLayout);
    vv?.addEventListener("scroll", syncKeyboardLayout);
    window.addEventListener("keydown", onKey);
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", onTouchMove);
      vv?.removeEventListener("resize", syncKeyboardLayout);
      vv?.removeEventListener("scroll", syncKeyboardLayout);
      const panel = panelRef.current;
      panel?.style.removeProperty("--care-assist-kb-inset");
      panel?.style.removeProperty("--care-assist-vv-h");
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.classList.remove("care-assist-open");
      html.classList.remove("care-assist-open");
      lenis?.start();
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

  sendMessageRef.current = sendMessage;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      <div className="care-assist-dock">
        <button
          type="button"
          className={`care-assist-fab${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-controls="care-assist-panel"
          aria-label={
            open ? "Cerrar orientación" : "Abrir orientación de cuidado"
          }
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg
              className="care-assist-fab-icon"
              width="22"
              height="22"
              viewBox="0 0 30 30"
              aria-hidden={true}
            >
              <path
                d="M9 9L21 21M21 9L9 21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              className="care-assist-fab-icon"
              viewBox="0 0 32 32"
              width="24"
              height="24"
              aria-hidden={true}
            >
              <path
                fill="currentColor"
                d="M16.01 3.2c-7.06 0-12.79 5.72-12.79 12.78 0 2.25.59 4.45 1.7 6.39L3 29l6.83-1.78a12.74 12.74 0 0 0 6.18 1.58h.01c7.05 0 12.78-5.72 12.78-12.78S23.07 3.2 16.01 3.2Zm0 23.44h-.01a10.6 10.6 0 0 1-5.4-1.48l-.38-.23-4.06 1.06 1.08-3.96-.25-.4a10.6 10.6 0 0 1-1.64-5.6c0-5.87 4.78-10.64 10.66-10.64 2.84 0 5.52 1.1 7.53 3.11a10.56 10.56 0 0 1 3.11 7.53c0 5.88-4.78 10.64-10.64 10.64Zm5.83-7.97c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.2.32-.79 1.04-.97 1.25-.18.21-.36.24-.68.08-.32-.16-1.33-.49-2.53-1.56-.93-.83-1.56-1.86-1.75-2.18-.18-.32-.02-.5.14-.66.14-.14.32-.36.47-.54.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.56.08-.86.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.15 3.09 1.31 3.3.16.21 2.26 3.45 5.47 4.83.76.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z"
              />
            </svg>
          )}
        </button>
      </div>

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

        <div ref={listRef} className="care-assist-messages">
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
                    <button
                      type="button"
                      className="care-assist-action care-assist-action--gold js-open-reserva-panel"
                      onClick={() => setOpen(false)}
                    >
                      Reservar cita
                    </button>
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
          <div className="care-assist-chips-block">
            <p className="care-assist-chips-label" id="care-assist-chips-label">
              Empieza por…
            </p>
            <div
              className="care-assist-chips"
              role="list"
              aria-labelledby="care-assist-chips-label"
            >
              {CARE_ASSIST_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={
                    "care-assist-chip" +
                    (input === chip.prompt ? " is-selected" : "")
                  }
                  role="listitem"
                  disabled={pending}
                  onClick={() => {
                    setInput(chip.prompt);
                    const coarse = window.matchMedia("(pointer: coarse)").matches;
                    if (!coarse) {
                      window.requestAnimationFrame(() =>
                        inputRef.current?.focus(),
                      );
                    }
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
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
            disabled={limitReached}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="on"
            onChange={(event) => setInput(event.target.value)}
            onFocus={() => {
              /* Evita el scrollIntoView agresivo de iOS al abrir el teclado. */
              const y = window.scrollY;
              window.requestAnimationFrame(() => {
                window.scrollTo(0, y);
                window.setTimeout(() => window.scrollTo(0, 0), 50);
              });
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!pending) void sendMessage(input);
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

        <a
          href="https://wa.me/34644577798"
          className="care-assist-wa"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
        >
          Hablar por WhatsApp
        </a>

        {error ? (
          <p className="care-assist-error" role="status">
            {error}
          </p>
        ) : null}
      </div>
    </>
  );
}
