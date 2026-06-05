import { readFileSync } from "node:fs";
import { join } from "node:path";

const LEGAL_DIR = join(process.cwd(), "content/legal");

export function getLegalDocument(slug: string): string {
  return readFileSync(join(LEGAL_DIR, `${slug}.md`), "utf8");
}
