/** Utilidades de descripción HTML para la tienda pública. */

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "span",
]);

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitiza HTML de descripción: desenvuelve divs, elimina etiquetas no
 * permitidas y limpia párrafos vacíos.
 */
export function sanitizeProductDescriptionHtml(html: string | null): string {
  if (!html?.trim()) return "";

  let value = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?div\b[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "<br />")
    .trim();

  value = value.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, tag, attrs) => {
    const name = String(tag).toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (name === "br") return "<br />";
    if (name === "a") {
      const hrefMatch = String(attrs ?? "").match(
        /\shref\s*=\s*(["'])(.*?)\1/i,
      );
      const href = hrefMatch?.[2]?.trim() ?? "";
      if (!/^(https?:|mailto:)/i.test(href)) return "";
      const closing = full.startsWith("</");
      return closing
        ? "</a>"
        : `<a href="${href}" rel="noopener noreferrer" target="_blank">`;
    }
    return full.startsWith("</") ? `</${name}>` : `<${name}>`;
  });

  value = value
    .replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br />")
    .trim();

  if (!value) return "";
  if (!/^<[a-z]/i.test(value)) {
    return `<p>${value}</p>`;
  }
  return value;
}

/** Divide texto plano en frases. */
export function splitSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const parts = trimmed
    .split(/(?<=[.!?…])\s+|(?<=[🐾✨❤️🤎])\s+(?=[A-ZÁÉÍÓÚÜÑ¡¿])/u)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : [trimmed];
}

export function descriptionHasMoreContent(html: string | null): boolean {
  if (!html?.trim()) return false;
  const plain = htmlToPlainText(html);
  const sentences = splitSentences(plain);
  if (sentences.length > 3) return true;
  if (plain.length > 180) return true;
  return false;
}
