/** Prefijo INE (2 dígitos) → provincia. */
const ES_PROVINCES_BY_PREFIX: Record<string, string> = {
  "01": "Álava",
  "02": "Albacete",
  "03": "Alicante",
  "04": "Almería",
  "05": "Ávila",
  "06": "Badajoz",
  "07": "Illes Balears",
  "08": "Barcelona",
  "09": "Burgos",
  "10": "Cáceres",
  "11": "Cádiz",
  "12": "Castellón",
  "13": "Ciudad Real",
  "14": "Córdoba",
  "15": "A Coruña",
  "16": "Cuenca",
  "17": "Girona",
  "18": "Granada",
  "19": "Guadalajara",
  "20": "Gipuzkoa",
  "21": "Huelva",
  "22": "Huesca",
  "23": "Jaén",
  "24": "León",
  "25": "Lleida",
  "26": "La Rioja",
  "27": "Lugo",
  "28": "Madrid",
  "29": "Málaga",
  "30": "Murcia",
  "31": "Navarra",
  "32": "Ourense",
  "33": "Asturias",
  "34": "Palencia",
  "35": "Las Palmas",
  "36": "Pontevedra",
  "37": "Salamanca",
  "38": "Santa Cruz de Tenerife",
  "39": "Cantabria",
  "40": "Segovia",
  "41": "Sevilla",
  "42": "Soria",
  "43": "Tarragona",
  "44": "Teruel",
  "45": "Toledo",
  "46": "Valencia",
  "47": "Valladolid",
  "48": "Bizkaia",
  "49": "Zamora",
  "50": "Zaragoza",
  "51": "Ceuta",
  "52": "Melilla",
};

export type EsPostalLookup = {
  postalCode: string;
  city: string | null;
  province: string | null;
};

export function normalizeEsPostalCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, 5);
}

export function isCompleteEsPostalCode(value: string): boolean {
  return /^\d{5}$/.test(normalizeEsPostalCode(value));
}

export function provinceFromEsPostalCode(postalCode: string): string | null {
  const code = normalizeEsPostalCode(postalCode);
  if (code.length < 2) return null;
  return ES_PROVINCES_BY_PREFIX[code.slice(0, 2)] ?? null;
}

type ZippopotamResponse = {
  places?: Array<{
    "place name"?: string;
    state?: string;
  }>;
};

export async function lookupEsPostalCode(
  postalCode: string,
): Promise<EsPostalLookup | null> {
  const code = normalizeEsPostalCode(postalCode);
  if (!isCompleteEsPostalCode(code)) return null;

  const province = provinceFromEsPostalCode(code);
  let city: string | null = null;

  try {
    const res = await fetch(`https://api.zippopotam.us/es/${code}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (res.ok) {
      const data = (await res.json()) as ZippopotamResponse;
      const place = data.places?.[0]?.["place name"]?.trim();
      if (place) city = place;
    }
  } catch {
    // Provincia sigue disponible aunque falle la ciudad.
  }

  if (!city && !province) return null;
  return { postalCode: code, city, province };
}
