/** Auth del deck interno `/vigo-bodas` (stand ferias). */

export const VIGO_BODAS_ACCESS_COOKIE = "mv_vigo_bodas_access";
export const VIGO_BODAS_ACCESS_VALUE = "granted";

/** Contraseña del stand. Preferir `VIGO_BODAS_PASSWORD` en el entorno. */
export function vigoBodasPassword(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const fromEnv = env.VIGO_BODAS_PASSWORD?.trim();
  return fromEnv || "VigoBodas2026";
}

export function hasVigoBodasAccess(
  cookieValue: string | undefined | null,
): boolean {
  return cookieValue === VIGO_BODAS_ACCESS_VALUE;
}
