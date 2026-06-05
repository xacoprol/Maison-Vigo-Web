"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useId, useState } from "react";

import { bookingUrl } from "@/lib/site-config";

import { WaveText } from "./wave-text";

import "./contact-form-section.css";

type ContactFieldErrors = {
  name?: string;
  email?: string;
  subject?: string;
};

const CONTACT_FIELD_ORDER = ["name", "email", "subject"] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactForm(data: FormData): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const subject = String(data.get("subject") ?? "").trim();

  if (!name) errors.name = "Indica tu nombre";
  if (!email) errors.email = "Indica tu email";
  else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Revisa el formato del email";
  }
  if (!subject) errors.subject = "Indica el asunto";

  return errors;
}

function hasContactErrors(errors: ContactFieldErrors) {
  return CONTACT_FIELD_ORDER.some((field) => errors[field]);
}

export function ContactFormSection() {
  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const subjectId = `${formId}-subject`;
  const nameErrorId = `${formId}-name-error`;
  const emailErrorId = `${formId}-email-error`;
  const subjectErrorId = `${formId}-subject-error`;
  const formHintId = `${formId}-hint`;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const showErrors = hasAttempted && hasContactErrors(errors);
  const showFormAlert = showErrors || Boolean(submitError);

  const clearFieldError = (field: keyof ContactFieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitted || isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nextErrors = validateContactForm(formData);
    setHasAttempted(true);
    setErrors(nextErrors);
    setSubmitError(null);

    if (hasContactErrors(nextErrors)) {
      const firstInvalid = CONTACT_FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) {
        const fieldEl = form.elements.namedItem(firstInvalid);
        if (fieldEl instanceof HTMLElement) {
          fieldEl.focus();
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim(),
          subject: String(formData.get("subject") ?? "").trim(),
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setSubmitError(
          data?.error ??
            "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.",
        );
        return;
      }

      setIsSubmitted(true);
    } catch {
      setSubmitError(
        "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="formulario-contacto"
      className="contact-form-section"
      aria-labelledby="contact-form-heading"
    >
      <div className="contact-form-section__media" aria-hidden={true}>
        <Image
          src="/assets/images/la-bienvenida.webp"
          alt=""
          fill
          className="contact-form-section__img"
          sizes="40vw"
          quality={82}
          priority={false}
        />
      </div>

      <div className="contact-form-section__main">
        <header className="contact-form-section__header">
          <span className="section-label">Contacto</span>
          <h2 className="contact-form-section__title" id="contact-form-heading">
            {isSubmitted ? "Gracias" : "Escríbenos"}
          </h2>
        </header>

        {isSubmitted ? (
          <div
            className="contact-form-section__success"
            role="status"
            aria-live="polite"
          >
            <p className="contact-form-section__success-lead">
              Hemos recibido tu mensaje.
            </p>
            <p className="contact-form-section__success-note">
              Si lo prefieres, puedes{" "}
              <a
                href={bookingUrl}
                className="contact-form-section__success-link mob-link--wave"
                target="_blank"
                rel="noopener noreferrer"
              >
                <WaveText text="reservar cita" screenReaderDuplicate={false} />
              </a>{" "}
              directamente desde tu panel privado{" "}
              <span className="contact-form-section__success-nowrap">MV Care</span>.
            </p>
          </div>
        ) : (
          <form
            className="contact-form-section__form"
            onSubmit={onSubmit}
            noValidate
            aria-describedby={showFormAlert ? formHintId : undefined}
          >
            <p
              id={formHintId}
              className={
                "contact-form-section__form-hint" +
                (showFormAlert ? " contact-form-section__form-hint--visible" : "")
              }
              role={showFormAlert ? "alert" : undefined}
              aria-hidden={!showFormAlert}
            >
              {submitError ??
                (showErrors
                  ? "Completa los campos para enviar tu mensaje"
                  : "")}
            </p>

            <div
              className={
                "contact-form-section__field" +
                (showErrors && errors.name
                  ? " contact-form-section__field--invalid"
                  : "")
              }
            >
              <label className="contact-form-section__label" htmlFor={nameId}>
                Nombre
              </label>
              <input
                id={nameId}
                className="contact-form-section__input"
                type="text"
                name="name"
                autoComplete="name"
                aria-invalid={showErrors && errors.name ? true : undefined}
                aria-describedby={
                  showErrors && errors.name ? nameErrorId : undefined
                }
                onInput={() => {
                  clearFieldError("name");
                  setSubmitError(null);
                }}
              />
              <p
                id={nameErrorId}
                className={
                  "contact-form-section__field-error" +
                  (showErrors && errors.name
                    ? " contact-form-section__field-error--visible"
                    : "")
                }
                aria-hidden={!(showErrors && errors.name)}
              >
                {errors.name ?? ""}
              </p>
            </div>

            <div
              className={
                "contact-form-section__field" +
                (showErrors && errors.email
                  ? " contact-form-section__field--invalid"
                  : "")
              }
            >
              <label className="contact-form-section__label" htmlFor={emailId}>
                Email
              </label>
              <input
                id={emailId}
                className="contact-form-section__input"
                type="email"
                name="email"
                autoComplete="email"
                aria-invalid={showErrors && errors.email ? true : undefined}
                aria-describedby={
                  showErrors && errors.email ? emailErrorId : undefined
                }
                onInput={() => {
                  clearFieldError("email");
                  setSubmitError(null);
                }}
              />
              <p
                id={emailErrorId}
                className={
                  "contact-form-section__field-error" +
                  (showErrors && errors.email
                    ? " contact-form-section__field-error--visible"
                    : "")
                }
                aria-hidden={!(showErrors && errors.email)}
              >
                {errors.email ?? ""}
              </p>
            </div>

            <div
              className={
                "contact-form-section__field contact-form-section__field--subject" +
                (showErrors && errors.subject
                  ? " contact-form-section__field--invalid"
                  : "")
              }
            >
              <label
                className="contact-form-section__label"
                htmlFor={subjectId}
              >
                Asunto
              </label>
              <input
                id={subjectId}
                className="contact-form-section__input"
                type="text"
                name="subject"
                aria-invalid={showErrors && errors.subject ? true : undefined}
                aria-describedby={
                  showErrors && errors.subject ? subjectErrorId : undefined
                }
                onInput={() => {
                  clearFieldError("subject");
                  setSubmitError(null);
                }}
              />
              <p
                id={subjectErrorId}
                className={
                  "contact-form-section__field-error" +
                  (showErrors && errors.subject
                    ? " contact-form-section__field-error--visible"
                    : "")
                }
                aria-hidden={!(showErrors && errors.subject)}
              >
                {errors.subject ?? ""}
              </p>
            </div>

            <div className="contact-form-section__footer">
              <p className="contact-form-section__consent">
                <span className="contact-form-section__consent-inner">
                  Al pulsar el botón, tomas la decisión acertada 🤎 y aceptas la{" "}
                  <Link
                    className="contact-form-section__consent-link mob-link--wave"
                    href="/privacidad"
                  >
                    <WaveText
                      text="política de privacidad"
                      screenReaderDuplicate={false}
                    />
                  </Link>
                </span>
              </p>

              <div className="contact-form-section__actions">
                <button
                  type="submit"
                  className="contact-form-section__submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  <svg
                    className="contact-form-section__submit-ring"
                    viewBox="0 0 100 100"
                    aria-hidden={true}
                  >
                    <circle
                      className="contact-form-section__submit-ring-path"
                      cx="50"
                      cy="50"
                      r="49.5"
                    />
                  </svg>
                  <span className="contact-form-section__submit-label mob-link--wave">
                    <WaveText text="Enviar" screenReaderDuplicate={false} />
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
