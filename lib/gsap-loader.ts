const GSAP_URL = "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js";
const SCROLL_TRIGGER_URL =
  "https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export async function loadGsap() {
  if (window.gsap && window.ScrollTrigger) {
    return { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger };
  }
  await loadScript(GSAP_URL);
  await loadScript(SCROLL_TRIGGER_URL);
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) {
    throw new Error("GSAP failed to load");
  }
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}
