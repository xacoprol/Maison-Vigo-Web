"use client";

import { useRouter } from "next/navigation";
import type { Components } from "react-markdown";
import Markdown from "react-markdown";

import { ObfuscatedEmail } from "./obfuscated-email";

import "./legal-document.css";

const EMAIL_TOKEN = /\[\[EMAIL:([^|\]]+)\|([^\]]+)\]\]/g;

/** Sustituye tokens por enlaces internos; un solo bloque Markdown evita saltos de línea. */
function preprocessLegalMarkdown(markdown: string) {
  return markdown.replace(EMAIL_TOKEN, "[$1@$2](email:$1|$2)");
}

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => {
    if (href?.startsWith("email:")) {
      const match = /^email:([^|]+)\|(.+)$/.exec(href);
      if (match) {
        const [, local, domain] = match;
        return <ObfuscatedEmail local={local} domain={domain} />;
      }
    }

    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
};

export function LegalDocumentBody({
  title,
  markdown,
  headingLevel = 1,
}: {
  title: string;
  markdown: string;
  headingLevel?: 1 | 2;
}) {
  const HeadingTag = headingLevel === 2 ? "h2" : "h1";
  return (
    <article className="legal-document">
      <header className="legal-document__header">
        <p className="legal-document__brand">Maison Vigo</p>
        <HeadingTag className="legal-document__title">{title}</HeadingTag>
        <p className="legal-document__updated">
          Última actualización: 2 de junio de 2026
        </p>
      </header>
      <div className="legal-document__body">
        <Markdown components={markdownComponents}>
          {preprocessLegalMarkdown(markdown)}
        </Markdown>
      </div>
    </article>
  );
}

type LegalDocumentProps = {
  title: string;
  markdown: string;
};

export function LegalDocument({ title, markdown }: LegalDocumentProps) {
  const router = useRouter();

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <main className="legal-page">
      <div className="legal-page__inner">
        <button
          type="button"
          className="legal-document__back"
          onClick={onBack}
          aria-label="Volver atrás"
        >
          <span className="legal-document__back-mark" aria-hidden={true}>
            ←
          </span>
          Volver
        </button>
        <LegalDocumentBody title={title} markdown={markdown} />
      </div>
    </main>
  );
}
