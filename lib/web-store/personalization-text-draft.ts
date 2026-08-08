/** Generador local de textos de grabado (mascotas). ~90% español, tono afectuoso. */

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

/** Palabras cortas que caben en grabados pequeños. */
const STYLE_WORDS = [
  // Vínculo / cariño
  "Amor", "Fiel", "Dulce", "Mío", "Mía", "Siempre", "Juntos", "Hogar",
  "Familia", "Alma", "Luz", "Vida", "Tesoro", "Cariño", "Mimoso", "Mimosa",
  "Bombón", "Corazón", "Único", "Única", "Libre", "Valiente", "Guardián",
  "Compañero", "Compañera", "Eterno", "Contigo", "♡",
  // Mundo perruno / mascota
  "Peludo", "Peluda", "Patitas", "Huellas", "Guau", "Wau", "Colita",
  "Orejas", "Hocico", "Bebé", "Princesa", "Príncipe", "Rey", "Reina",
  "Nube", "Sol", "Miel", "Canela", "Trufa", "Canijo",
  "Travieso", "Traviesa", "Ladrón", "Ladrona", "Paseo", "Parque",
  // Poco inglés (lo que sí usa la clientela)
  "Forever", "Pup", "Paws",
];

/** Frases cortas; prioriza emoción y vida con el perro. */
const STYLE_PHRASES = [
  "Mi peludo", "Mi peluda", "Mi bebé", "Mi vida", "Mi sol", "Mi nube",
  "Mi rey", "Mi reina", "Mi tesoro", "Mi cariño", "Mi hogar", "Mi luz",
  "Mi norte", "Mi todo", "Mi familia", "Con amor", "Para ti", "Contigo.",
  "Para siempre", "Siempre juntos", "Contigo siempre", "Hasta siempre",
  "Mejor amigo", "Mejor amiga", "Amor eterno", "Almas unidas",
  "4 patitas", "Patitas ♡", "Huellas ♡", "Amor de 4 patas",
  "Fiel amigo", "Fiel amiga", "Mi guardián", "Mi compañero",
  "Mi compañera", "Vida peluda", "Cola feliz", "Guau guau",
  "Paseitos", "A tu lado", "Sin ti, nada", "Mi persona",
  "Te elijo", "Siempre tú", "Mi primer amor",
  // ~10% inglés habitual
  "Forever ♡", "Best friend",
];

/** Toque local Maison Vigo / Galicia (poca proporción). */
const PLACES = ["Vigo", "Galicia", "Cíes", "Rías", "42°N"];

const FALLBACK_ES = ["♡", "Amor", "Fiel", "Patitas", "Mi vida", "Siempre"];

/** No sugerir «Chulo/Chula» salvo que sea el nombre real de la mascota. */
function isBlockedSuggestion(text: string, petName?: string | null): boolean {
  const t = normalize(text).toLowerCase().replace(/[♡❤️.\s]+$/g, "").trim();
  if (t !== "chulo" && t !== "chula") return false;
  const pet = normalize(String(petName ?? "")).toLowerCase();
  return pet !== t;
}

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

function looksSpanish(text: string): boolean {
  const t = normalize(text);
  if (/[áéíóúüñ¿¡]/i.test(t)) return true;
  if (/♡/.test(t)) return true;
  // Common Spanish engraving words without accents
  if (
    /\b(amor|fiel|dulce|siempre|juntos|hogar|familia|alma|luz|vida|tesoro|cariño|peludo|peluda|patitas|huellas|guau|bebé|bebe|princesa|nube|miel|contigo|mío|mio|mía|mia|único|unica|única|libre|guardián|guardian|paseo|parque|colita|hocico|canela|trufa|canijo|travieso|compañero|companero|compañera|eterno|valiente|bombón|bombon)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  if (/^(mi |para |con |hasta |sin |a tu )/i.test(t)) return true;
  return false;
}

function band(max: number): "initials" | "tiny" | "short" | "medium" | "roomy" {
  if (max <= 3) return "initials";
  if (max <= 6) return "tiny";
  if (max <= 10) return "short";
  if (max <= 16) return "medium";
  return "roomy";
}

function petVariants(pet: string, max: number): string[] {
  const name = normalize(pet);
  if (!name) return [];
  const out: string[] = [];
  const candidates = [
    name,
    `${name} ♡`,
    `Mi ${name}`,
    `Para ${name}`,
    `${name}.`,
    `Te quiero, ${name}`,
    `${name} forever`,
    `Siempre, ${name}`,
    `${name} · ♡`,
  ];
  for (const c of candidates) {
    if (fits(c, max)) out.push(c);
  }
  return out;
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

  // Pet name ideas first when we know them.
  for (const v of petVariants(pet, max)) raw.push(v);

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
      const esBoost = looksSpanish(c) ? 3 : 0;
      const petBoost =
        pet && c.toLowerCase().includes(pet.toLowerCase()) ? 4 : 0;
      return { c, score: fillScore + phrasePenalty + esBoost + petBoost };
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

  const pool = buildPool(input).filter(
    (c) => !avoid.has(c.toLowerCase()) && !isBlockedSuggestion(c, input.petName),
  );
  const source = pool.length
    ? pool
    : FALLBACK_ES.filter((c) => fits(c, max));
  if (!source.length) return [(finalize("♡", max) ?? "♡").slice(0, max)];

  // ~90% español: toma primero del tramo español del pool (ya ordenado).
  const spanish = source.filter(looksSpanish);
  const rest = source.filter((c) => !looksSpanish(c));
  const ordered =
    spanish.length >= Math.ceil(count * 0.75)
      ? [...spanish, ...rest]
      : source;

  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < ordered.length && out.length < count; i++) {
    const pick = ordered[(salt - 1 + i) % ordered.length]!;
    const key = pick.toLowerCase();
    if (seen.has(key)) continue;
    const done = finalize(pick, max);
    if (!done) continue;
    seen.add(key);
    out.push(done);
  }

  // Si el salt cicló poco, rellena secuencialmente.
  if (out.length < count) {
    for (const pick of ordered) {
      if (out.length >= count) break;
      const key = pick.toLowerCase();
      if (seen.has(key)) continue;
      const done = finalize(pick, max);
      if (!done) continue;
      seen.add(key);
      out.push(done);
    }
  }

  return out;
}
