/** Generador local de textos de grabado (mascotas / ñoño). Sin depender del API Care. */

export type PersonalizationDraftInput = {
  productName?: string;
  fieldLabel: string;
  maxLength?: number | null;
  petName?: string | null;
  otherTexts?: string[];
  currentValue?: string | null;
  salt?: number | null;
  count?: number;
};

const STYLE_WORDS = [
  "Eterno", "Forever", "Always", "Juntos", "Siempre", "Hogar", "Amor",
  "Familia", "Luz", "Vida", "Mía", "Soul", "Home", "Love", "Brave",
  "Wild", "Free", "Bond", "True", "Stay", "Hope", "Dream", "Grace",
  "Loyal", "Gentle", "Darling", "Cherish", "Ever", "Bloom", "Spark",
  "Shine", "Soft", "Warm", "Alma", "Fiel", "Dulce", "Libre", "Única",
  "Siempre.", "Contigo", "♡",
  "Peludo", "Peluda", "Patitas", "Cariño", "Bebé", "Guau", "Miau", "Pup",
  "Kitty", "Buddy", "Bestie", "Paws", "Nube", "Sol", "Miel", "Princesa",
  "Tesoro", "Corazón", "Mimosa",
];

const STYLE_PHRASES = [
  "Para ti", "Mi hogar", "Mi luz", "Stay wild", "Almas unidas",
  "Contigo.", "My love", "Mi norte", "Con alma",
  "Mi bebé", "Mi vida", "Mi rey", "Mi reina", "Mi sol", "Mi nube", "Con amor",
  "Para siempre", "Mi peludo", "Mi peluda", "Patitas ♡",
  "Love you", "My baby", "My angel", "Sweet soul",
];

const PLACES = ["Vigo", "42°N", "Galicia", "Rías", "Cíes", "42.2N"];

function resolveMax(maxLength?: number | null): number {
  return maxLength != null && maxLength > 0 ? maxLength : 28;
}

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function fits(text: string, max: number): boolean {
  const t = normalize(text);
  return t.length > 0 && t.length <= max;
}

function capitalize(text: string): string {
  const t = text.trim();
  if (!t) return "";
  if (/^[A-ZÁÉÍÓÚÜÑ]{1,4}$/u.test(t)) return t;
  if (/^-?\d/.test(t)) return t;
  return t.charAt(0).toLocaleUpperCase("es-ES") + t.slice(1);
}

function finalize(text: string, max: number): string | null {
  const t = normalize(text);
  if (!fits(t, max)) return null;
  return capitalize(t);
}

function isSingleToken(text: string): boolean {
  return !/\s/.test(normalize(text));
}

function band(max: number): "initials" | "tiny" | "short" | "medium" | "roomy" {
  if (max <= 3) return "initials";
  if (max <= 6) return "tiny";
  if (max <= 10) return "short";
  if (max <= 16) return "medium";
  return "roomy";
}

function buildPool(input: PersonalizationDraftInput): string[] {
  const pet = String(input.petName ?? "").trim();
  const max = resolveMax(input.maxLength);
  const b = band(max);
  const label = String(input.fieldLabel ?? "").toLowerCase();
  const raw: string[] = [];

  if (b === "initials" || /inicial/.test(label)) {
    if (pet) raw.push(pet.slice(0, 1).toUpperCase());
  }

  for (const w of STYLE_WORDS) {
    if (fits(w, max)) raw.push(w);
  }
  for (const p of PLACES) {
    if (fits(p, max)) raw.push(p);
  }
  if (b === "medium" || b === "roomy" || (b === "short" && max >= 7)) {
    for (const p of STYLE_PHRASES) {
      if (fits(p, max)) raw.push(p);
    }
  }
  if (pet && fits(pet, max)) raw.push(pet);
  if (pet && fits(`${pet} ♡`, max)) raw.push(`${pet} ♡`);

  let filtered = raw.filter((c) => fits(c, max));
  if (b === "tiny" || b === "short") {
    const singles = filtered.filter(isSingleToken);
    if (singles.length >= 8) filtered = singles;
  }

  const unique = Array.from(
    new Map(
      filtered.map((c) => {
        const n = normalize(c);
        return [n.toLowerCase(), capitalize(n)] as const;
      }),
    ).values(),
  ).filter((c) => fits(c, max));

  return unique
    .map((c) => {
      const fill = c.length / max;
      const fillScore = fill >= 0.45 ? 2 : fill >= 0.3 ? 1 : 0;
      const phrasePenalty = !isSingleToken(c) && b === "short" ? -1 : 0;
      return { c, score: fillScore + phrasePenalty };
    })
    .sort((a, b2) => b2.score - a.score || a.c.localeCompare(b2.c, "es"))
    .map((s) => s.c);
}

/** Varias ideas distintas para elegir (respeta maxLength). */
export function buildPersonalizationTextOptions(
  input: PersonalizationDraftInput,
): string[] {
  const max = resolveMax(input.maxLength);
  const count = Math.min(12, Math.max(4, Math.round(Number(input.count ?? 8))));
  const salt = Math.abs(Math.floor(input.salt ?? 1)) || 1;
  const avoid = new Set(
    [...(input.otherTexts ?? []), String(input.currentValue ?? "")]
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );

  const pool = buildPool(input).filter((c) => !avoid.has(c.toLowerCase()));
  const source = pool.length ? pool : ["♡", "Amor", "Fiel", "Luz", "Soul"].filter((c) => fits(c, max));
  if (!source.length) return [(finalize("♡", max) ?? "♡").slice(0, max)];

  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < source.length && out.length < count; i++) {
    const pick = source[(salt - 1 + i) % source.length]!;
    const key = pick.toLowerCase();
    if (seen.has(key)) continue;
    const done = finalize(pick, max);
    if (!done) continue;
    seen.add(key);
    out.push(done);
  }
  return out;
}
