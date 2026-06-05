"use client";

type ObfuscatedEmailProps = {
  local: string;
  domain: string;
  className?: string;
};

/** Enlace mailto sin exponer la dirección completa en el HTML estático. */
export function ObfuscatedEmail({
  local,
  domain,
  className,
}: ObfuscatedEmailProps) {
  const openMail = () => {
    window.location.href = `mailto:${local}@${domain}`;
  };

  return (
    <button
      type="button"
      className={className ?? "legal-email-link"}
      onClick={openMail}
    >
      <span className="legal-email-link__local">{local}</span>
      <span className="legal-email-link__at" aria-hidden={true}>
        @
      </span>
      <span className="legal-email-link__domain">{domain}</span>
    </button>
  );
}
