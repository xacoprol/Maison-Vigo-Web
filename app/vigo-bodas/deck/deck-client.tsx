"use client";

import { useEffect, useRef } from "react";

import { AcompanamientoInquirySheet } from "@/app/acompanamiento-inquiry-sheet";

import "./deck.css";

function Photo({
  src,
  alt = "",
  hint,
}: {
  src: string;
  alt?: string;
  hint?: string;
}) {
  return (
    <div className="vigo-bodas-deck__photo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onError={(e) => e.currentTarget.classList.add("is-missing")}
      />
      {hint ? <div className="vigo-bodas-deck__hint">{hint}</div> : null}
    </div>
  );
}

function StepPage({
  src,
  hint,
  num,
  phase,
  title,
  lead,
}: {
  src: string;
  hint: string;
  num: string;
  phase: string;
  title: string;
  lead: string;
}) {
  return (
    <section className="vigo-bodas-deck__page">
      <Photo src={src} hint={hint} />
      <div className="vigo-bodas-deck__body">
        <span className="vigo-bodas-deck__num">{num}</span>
        <span className="vigo-bodas-deck__phase">{phase}</span>
        <h2>{title}</h2>
        <p className="vigo-bodas-deck__lead">{lead}</p>
      </div>
    </section>
  );
}

export function VigoBodasDeckClient() {
  const deckRef = useRef<HTMLElement>(null);
  const dotsRef = useRef<HTMLElement>(null);

  const goToFirstSlide = () => {
    const first = deckRef.current?.querySelector<HTMLElement>(
      ".vigo-bodas-deck__page",
    );
    first?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const deck = deckRef.current;
    const dots = dotsRef.current;
    if (!deck || !dots) return;

    const pages = [...deck.querySelectorAll<HTMLElement>(".vigo-bodas-deck__page")];
    dots.replaceChildren();
    for (const _ of pages) {
      dots.appendChild(document.createElement("i"));
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = pages.indexOf(entry.target as HTMLElement);
          [...dots.children].forEach((d, j) =>
            d.classList.toggle("is-on", j === i),
          );
          dots.classList.toggle(
            "is-dark",
            (entry.target as HTMLElement).classList.contains(
              "vigo-bodas-deck__page--statement",
            ),
          );
        }
      },
      { root: deck, threshold: 0.6 },
    );
    pages.forEach((p) => io.observe(p));

    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("form, input, textarea, button")) {
        return;
      }
      const i = Math.round(deck.scrollTop / window.innerHeight);
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        pages[Math.min(i + 1, pages.length - 1)]?.scrollIntoView({
          behavior: "smooth",
        });
      }
      if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        pages[Math.max(i - 1, 0)]?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="vigo-bodas-deck-root">
      <main className="vigo-bodas-deck" id="deck" ref={deckRef}>
        <section className="vigo-bodas-deck__page vigo-bodas-deck__page--cover">
          <Photo
            src="/acompanamiento.webp"
            alt="Perro acompañando en una boda"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="vigo-bodas-deck__logo"
            src="/logo-anim/anim-1.svg"
            alt="Maison Vigo"
            onError={(e) => e.currentTarget.remove()}
          />
          <div className="vigo-bodas-deck__body">
            <h1>
              Vuestro perro,
              <br />
              <em>en vuestra boda</em>
            </h1>
            <p className="vigo-bodas-deck__lead">
              Le acompañamos todo el día, de casa a casa.
            </p>
            <p className="vigo-bodas-deck__swipe">
              <span />
              Desliza hacia arriba
            </p>
          </div>
        </section>

        <section className="vigo-bodas-deck__page vigo-bodas-deck__page--text vigo-bodas-deck__page--alt">
          <div className="vigo-bodas-deck__body">
            <h2>Un día, cuatro momentos</h2>
            <ul className="vigo-bodas-deck__moments">
              <li>
                <b>1</b>
                <div>
                  <strong>Antes de la boda</strong>
                  <small>Recogida, puesta a punto y peluquería</small>
                </div>
              </li>
              <li>
                <b>2</b>
                <div>
                  <strong>Camino al pazo</strong>
                  <small>Paseo, traslado y reconocimiento</small>
                </div>
              </li>
              <li>
                <b>3</b>
                <div>
                  <strong>La ceremonia</strong>
                  <small>Invitados, alianzas y discreción</small>
                </div>
              </li>
              <li>
                <b>4</b>
                <div>
                  <strong>Después</strong>
                  <small>Fotos, guardería y vuelta a casa</small>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <StepPage
          src="/fotos-bodas/recogida.webp"
          hint="Foto: recogida en casa"
          num="01"
          phase="Antes de la boda"
          title="Recogida en casa"
          lead="Pasamos a buscarlo por vuestro domicilio. Vosotros, sin preocupaciones."
        />
        <StepPage
          src="/assets/images/contacto-footer.webp"
          hint="Foto: Maison Vigo"
          num="02"
          phase="Antes de la boda"
          title="Puesta a punto"
          lead="Llega a Maison Vigo y se relaja antes de prepararse."
        />
        <StepPage
          src="/fotos-bodas/peluqueria.webp"
          hint="Foto: peluquería"
          num="03"
          phase="Antes de la boda"
          title="Peluquería"
          lead="Baño y acabado con calma, para que luzca impecable."
        />
        <StepPage
          src="/fotos-bodas/paseo.webp"
          hint="Foto: paseo antes del traslado"
          num="04"
          phase="Camino al pazo"
          title="Paseo y traslado"
          lead="Un paseo para desconectar y hacer sus necesidades. Después, al pazo."
        />
        <StepPage
          src="/fotos-bodas/reconocimiento.webp"
          hint="Foto: reconocimiento del pazo"
          num="05"
          phase="Camino al pazo"
          title="Reconocimiento"
          lead="Recorre el pazo y huele cada rincón. Así, en la ceremonia, estará tranquilo."
        />

        <section className="vigo-bodas-deck__page vigo-bodas-deck__page--statement">
          <div className="vigo-bodas-deck__body">
            <h2>
              Un perro tranquilo,
              <br />
              <em>una ceremonia tranquila.</em>
            </h2>
          </div>
        </section>

        <StepPage
          src="/fotos-bodas/invitados.webp"
          hint="Foto: saludo a los invitados"
          num="06"
          phase="La ceremonia"
          title="Recepción de invitados"
          lead="Saluda a los invitados a su ritmo, siempre con nosotros."
        />
        <StepPage
          src="/fotos-bodas/alianzas.webp"
          hint="Foto: entrega de alianzas"
          num="07"
          phase="La ceremonia"
          title="Las alianzas"
          lead="Juntos, llevamos los anillos hasta el altar o la ceremonia civil."
        />
        <StepPage
          src="/fotos-bodas/ceremonia.webp"
          hint="Foto: durante la ceremonia"
          num="08"
          phase="La ceremonia"
          title="En segundo plano"
          lead="Nos retiramos con discreción hasta que termina la ceremonia."
        />

        <section className="vigo-bodas-deck__page vigo-bodas-deck__page--text vigo-bodas-deck__page--alt">
          <div className="vigo-bodas-deck__body">
            <h2>Complementos incluidos</h2>
            <p className="vigo-bodas-deck__lead">
              Todo lo que lleva ese día, preparado por nosotros.
            </p>
            <div className="vigo-bodas-deck__kit">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="vigo-bodas-deck__kit-photo"
                  src="/fotos-bodas/portaalianzas.webp"
                  alt="Portaalianzas en blanco"
                />
                <strong>Portaalianzas</strong>
                <small>Marrón o blanco, para llevar los anillos con seguridad.</small>
              </div>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="vigo-bodas-deck__kit-photo"
                  src="/fotos-bodas/correa-collar.webp"
                  alt="Correa y collar a juego"
                />
                <strong>Correa y collar</strong>
                <small>A juego, para todo el día.</small>
              </div>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="vigo-bodas-deck__kit-photo"
                  src="/fotos-bodas/joya.webp"
                  alt="Joya grabada personalizada"
                />
                <strong>Joya grabada</strong>
                <small>Una pieza a elegir, grabada para vosotros.</small>
              </div>
            </div>
          </div>
        </section>

        <StepPage
          src="/fotos-bodas/fotos.webp"
          hint="Foto: sesión con los novios"
          num="09"
          phase="Después"
          title="Sesión de fotos"
          lead="Vuelve para las fotos con vosotros. Un recuerdo para siempre."
        />
        <StepPage
          src="/fotos-bodas/guarderia.webp"
          hint="Foto: guardería"
          num="10"
          phase="Después"
          title="Noche en la guardería"
          lead="Descansa en nuestra guardería mientras disfrutáis de la celebración."
        />
        <StepPage
          src="/fotos-bodas/vuelta.webp"
          hint="Foto: vuelta a casa"
          num="11"
          phase="Después"
          title="De vuelta a casa"
          lead="Al día siguiente lo dejamos en vuestro domicilio."
        />

        <section className="vigo-bodas-deck__page vigo-bodas-deck__page--text vigo-bodas-deck__page--alt">
          <div className="vigo-bodas-deck__body">
            <h2>Gracias</h2>
          </div>
        </section>

        <section className="vigo-bodas-deck__page vigo-bodas-deck__page--form">
          <AcompanamientoInquirySheet
            embedded
            defaultLeadSource="vigo-bodas"
            onGoHome={goToFirstSlide}
          />
        </section>
      </main>
      <nav className="vigo-bodas-deck__dots" ref={dotsRef} aria-hidden="true" />
    </div>
  );
}
