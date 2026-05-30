/** Partes del texto editorial separadas por línea en blanco (`\n\n`). */
export function splitServicioBodySections(body: string): string[] {
  const parts = body
    .split(/\n\s*\n/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [body.trim()];
}
