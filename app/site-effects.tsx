"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname, useRouter } from "next/navigation";

import {
  buildSectionUrl,
  consumePendingHomeSection,
  isHomePathname,
  resolveHomeSectionId,
  sanitizeUrlHash,
  sectionIdFromHash,
  setPendingHomeSection,
} from "@/lib/hash-nav";
import { lockScroll, resetScrollLock, unlockScroll } from "@/lib/scroll-lock";
import { bookingUrl } from "@/lib/site-config";
import { isMobileSiteNav } from "@/lib/nav-mobile";

/**
 * Maneja UI global que existe en todas las páginas (nav, menú móvil,
 * panel de reserva, banner de cookies, smooth scroll). Las animaciones
 * específicas de la home se quedan en `<HomeEffects />`.
 */
const lenisEase = (t: number) => 1 - Math.pow(1 - t, 3);

export function SiteEffects() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHomePathname(pathname)) return;

    sanitizeUrlHash();

    const pending = consumePendingHomeSection();
    const sectionId =
      pending ?? sectionIdFromHash(window.location.hash);
    if (!sectionId) return;

    if (pending) {
      history.replaceState(history.state, "", buildSectionUrl(sectionId));
    }

    const scrollToSection = (attempt = 0) => {
      const target = document.getElementById(sectionId);
      if (!target) {
        if (attempt < 24) {
          requestAnimationFrame(() => scrollToSection(attempt + 1));
        }
        return;
      }

      const lenis = window.__mvLenis;
      if (lenis) {
        lenis.resize();
        lenis.scrollTo(target, {
          duration: 1.55,
          easing: lenisEase,
          force: true,
          programmatic: true,
        });
        return;
      }

      target.scrollIntoView({ behavior: "auto" });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToSection());
    });
  }, [pathname]);

  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const body = document.body;
    const cookieBanner = document.getElementById("cookieBanner");
    const cookieAccept = document.getElementById("cookieAccept");
    const cookieReject = document.getElementById("cookieReject");
    const whatsappFab = document.querySelector<HTMLElement>(".whatsapp-fab");
    const mobileMedia = window.matchMedia("(max-width: 900px)");
    const cookieConsentName = "mv_cookie_consent";
    const cookieConsentMaxAgeSec = 60 * 60 * 24 * 180;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let lenis: Lenis | null = null;
    let lenisRafId: number | undefined;

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        duration: 1.08,
        easing: lenisEase,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        prevent: (node) => node.closest(".servicios-carousel") !== null,
      });

      const lenisRaf = (time: number) => {
        lenis?.raf(time);
        lenisRafId = window.requestAnimationFrame(lenisRaf);
      };
      lenisRafId = window.requestAnimationFrame(lenisRaf);
      window.__mvLenis = lenis;
    }

    /**
     * Emite `mv-scroll` siempre (con o sin Lenis) para que los consumidores
     * (HomeEffects, EspacioHorizontalScroll) tengan UNA sola fuente de
     * verdad y no dupliquen trabajo escuchando también `scroll` nativo.
     */
    const dispatchMvScroll = (y: number) => {
      window.dispatchEvent(new CustomEvent("mv-scroll", { detail: { y } }));
    };

    const onScroll = (scrollY: number) => {
      navbar.classList.toggle("scrolled", scrollY > 40);
      if (whatsappFab) {
        if (!mobileMedia.matches) {
          whatsappFab.classList.add("whatsapp-fab--visible");
        } else {
          whatsappFab.classList.toggle("whatsapp-fab--visible", scrollY > 120);
        }
      }
      dispatchMvScroll(scrollY);
    };

    const onMobileMediaChange = () => {
      onScroll(lenis?.scroll ?? window.scrollY);
    };
    mobileMedia.addEventListener("change", onMobileMediaChange);

    let unsubscribeLenis: (() => void) | undefined;
    const onNativeScroll = () => onScroll(window.scrollY);
    if (lenis) {
      unsubscribeLenis = lenis.on("scroll", () => {
        onScroll(lenis.scroll);
        window.ScrollTrigger?.update();
      });
    } else {
      window.addEventListener("scroll", onNativeScroll, { passive: true });
    }
    onScroll(window.scrollY);

    const getCookie = (name: string) => {
      const found = document.cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`));
      return found ? decodeURIComponent(found.split("=")[1] ?? "") : "";
    };
    const setCookieConsent = (value: "accepted" | "rejected") => {
      document.cookie = `${cookieConsentName}=${value}; Max-Age=${cookieConsentMaxAgeSec}; Path=/; SameSite=Lax`;
    };
    const hideCookieBanner = () => {
      cookieBanner?.classList.add("cookie-banner--hidden");
    };
    const cookieConsent = getCookie(cookieConsentName);
    if (cookieConsent === "accepted" || cookieConsent === "rejected") {
      hideCookieBanner();
    }
    const onCookieAccept = () => {
      setCookieConsent("accepted");
      hideCookieBanner();
    };
    const onCookieReject = () => {
      setCookieConsent("rejected");
      hideCookieBanner();
    };
    cookieAccept?.addEventListener("click", onCookieAccept);
    cookieReject?.addEventListener("click", onCookieReject);

    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    const closeMenuEl = document.getElementById("closeMenu");
    const reservaPanel = document.getElementById("reservaPanel");
    const openReservaPanel = document.getElementById("openReservaPanel");
    const openReservaPanelFromMenu = document.getElementById(
      "openReservaPanelFromMenu",
    );
    const closeReservaPanel = document.getElementById("closeReservaPanel");
    const reservaIframe = reservaPanel?.querySelector<HTMLIFrameElement>(
      ".reserva-panel-iframe",
    );
    const mobLinks = document.querySelectorAll<HTMLElement>(".mob-link");
    const menuPrimaryLinks = document.querySelectorAll<HTMLElement>(
      ".mobile-menu-primary .mob-link--primary",
    );
    const menuMediaLayers = document.querySelectorAll<HTMLElement>(
      ".mobile-menu-media-layer",
    );

    const openMenu = () => {
      if (!mobileMenu) return;
      if (mobileMenu.classList.contains("open")) return;
      navbar?.classList.remove("nav-hidden");
      lockScroll();
      lenis?.stop();
      mobileMenu.classList.add("open");
      mobileMenu.setAttribute("aria-hidden", "false");
      hamburger?.setAttribute("aria-expanded", "true");
      body.classList.add("menu-open");
      document.documentElement.classList.add("menu-open");
    };
    const closeMenuFn = (preserveLock = false) => {
      if (!mobileMenu) return;
      if (!mobileMenu.classList.contains("open")) return;
      mobileMenu.classList.remove("open");
      mobileMenu.setAttribute("aria-hidden", "true");
      hamburger?.setAttribute("aria-expanded", "false");
      body.classList.remove("menu-open");
      document.documentElement.classList.remove("menu-open");
      if (!preserveLock) {
        unlockScroll();
        lenis?.start();
      }
    };
    const toggleMenu = () => {
      if (!mobileMenu) return;
      if (mobileMenu.classList.contains("open")) {
        closeMenuFn();
      } else {
        openMenu();
      }
    };
    const onMenuOverlayClick = (event: MouseEvent) => {
      if (event.target === mobileMenu) closeMenuFn();
    };
    const ensureReservaIframeLoaded = () => {
      if (!reservaIframe) return;
      const bookingSrc = reservaIframe.dataset.bookingSrc ?? bookingUrl;
      const currentSrc = reservaIframe.getAttribute("src") ?? "";
      if (currentSrc === bookingSrc) return;
      if (currentSrc && currentSrc !== "about:blank") return;
      reservaIframe.src = bookingSrc;
    };
    const openReservaPanelFn = () => {
      if (!reservaPanel) return;
      if (reservaPanel.classList.contains("open")) return;
      navbar?.classList.remove("nav-hidden");
      if (mobileMenu?.classList.contains("open")) {
        closeMenuFn(true);
      } else {
        lockScroll();
      }
      lenis?.stop();
      ensureReservaIframeLoaded();
      reservaPanel.classList.add("open");
      reservaPanel.setAttribute("aria-hidden", "false");
      body.classList.add("reserva-open");
      document.documentElement.classList.add("reserva-open");
    };
    const closeReservaPanelFn = () => {
      if (!reservaPanel) return;
      if (!reservaPanel.classList.contains("open")) return;
      reservaPanel.classList.remove("open");
      reservaPanel.setAttribute("aria-hidden", "true");
      body.classList.remove("reserva-open");
      document.documentElement.classList.remove("reserva-open");
      unlockScroll();
      lenis?.start();
    };
    const onCloseReservaClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      closeReservaPanelFn();
    };
    const onReservaOverlayClick = (event: MouseEvent) => {
      if (event.target === reservaPanel) closeReservaPanelFn();
    };
    const onOpenReservaClick = (event: Event) => {
      event.preventDefault();
      openReservaPanelFn();
    };
    const onCloseMenuClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      closeMenuFn();
    };
    const onMobLinkClick = (event: Event) => {
      const el = event.currentTarget as HTMLElement;
      const anchor =
        el instanceof HTMLAnchorElement ? el : el.closest("a");
      if (anchor instanceof HTMLAnchorElement && isInternalPageLink(anchor)) {
        closeMenuFn();
        return;
      }
      onCloseMenuClick(event);
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (reservaPanel?.classList.contains("open")) {
        closeReservaPanelFn();
        return;
      }
      closeMenuFn();
    };
    const setMenuImage = (imageId: string) => {
      menuMediaLayers.forEach((layer) => {
        layer.classList.toggle(
          "is-active",
          layer.dataset.menuImage === imageId,
        );
      });
    };
    const onPrimaryHover = (event: Event) => {
      const target = event.currentTarget as HTMLElement | null;
      const imageId = target?.dataset.menuImage;
      if (!imageId) return;
      setMenuImage(imageId);
    };
    const onPrimaryLeave = () => setMenuImage("foto1");

    const scrollToHomeSection = (sectionId: string) => {
      const target = document.getElementById(sectionId);
      if (!target) return;

      const lenisInstance = window.__mvLenis ?? lenis;
      if (lenisInstance) {
        lenisInstance.resize();
        lenisInstance.scrollTo(target, {
          duration: 1.55,
          easing: lenisEase,
          force: true,
          programmatic: true,
        });
        return;
      }

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    };

    const isHomeSectionAnchor = (anchor: HTMLAnchorElement) =>
      !!resolveHomeSectionId(anchor.getAttribute("href") ?? "");

    /** Rutas internas (/mvcare, /privacidad…) — no bloquear navegación al cerrar menú. */
    const isInternalPageLink = (anchor: HTMLAnchorElement) => {
      if (anchor.classList.contains("js-open-reserva-panel")) return false;
      const href = anchor.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//")) return false;
      return !resolveHomeSectionId(href);
    };

    const scheduleScrollToHomeSection = (sectionId: string) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToHomeSection(sectionId);
        });
      });
    };

    const navigateToHomeSection = (sectionId: string, event?: MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      const wasMenuOpen = mobileMenu?.classList.contains("open") ?? false;
      if (wasMenuOpen) closeMenuFn();

      const targetUrl = buildSectionUrl(sectionId);

      if (!isHomePathname(window.location.pathname)) {
        setPendingHomeSection(sectionId);
        router.push(targetUrl);
        return;
      }

      history.replaceState(history.state, "", targetUrl);
      if (wasMenuOpen) {
        window.setTimeout(() => scheduleScrollToHomeSection(sectionId), 0);
      } else {
        scheduleScrollToHomeSection(sectionId);
      }
    };

    /**
     * Enlaces /#seccion: un solo hash y scroll (evita #concepto#servicios en la home).
     */
    const onHashLinkClick = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.classList.contains("js-open-reserva-panel")) return;

      const sectionId = resolveHomeSectionId(anchor.getAttribute("href") ?? "");
      if (!sectionId) return;

      navigateToHomeSection(sectionId, event);
    };

    const menuSectionLinks = document.querySelectorAll<HTMLAnchorElement>(
      ".mobile-menu-primary a[href*='#'], .mobile-menu-secondary a[href*='#']",
    );

    const onMenuSectionClick = (event: MouseEvent) => {
      const anchor = event.currentTarget;
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const sectionId = resolveHomeSectionId(anchor.getAttribute("href") ?? "");
      if (!sectionId) return;

      navigateToHomeSection(sectionId, event);
    };

    const onHashChange = () => {
      sanitizeUrlHash();
      const sectionId = sectionIdFromHash(window.location.hash);
      if (!sectionId || !isHomePathname(window.location.pathname)) return;
      requestAnimationFrame(() => scrollToHomeSection(sectionId));
    };

    sanitizeUrlHash();
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onHashLinkClick, true);

    if (isHomePathname(window.location.pathname)) {
      const initialSection = sectionIdFromHash(window.location.hash);
      if (initialSection) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToHomeSection(initialSection));
        });
      }
    }

    hamburger?.addEventListener("click", toggleMenu);
    closeMenuEl?.addEventListener("click", onCloseMenuClick);
    menuSectionLinks.forEach((link) => {
      link.addEventListener("click", onMenuSectionClick);
    });
    mobLinks.forEach((l) => {
      const anchor = l.closest("a");
      if (anchor instanceof HTMLAnchorElement && isHomeSectionAnchor(anchor)) {
        return;
      }
      l.addEventListener("click", onMobLinkClick);
    });
    menuPrimaryLinks.forEach((link) => {
      link.addEventListener("mouseenter", onPrimaryHover);
      link.addEventListener("focus", onPrimaryHover);
      link.addEventListener("mouseleave", onPrimaryLeave);
      link.addEventListener("blur", onPrimaryLeave);
    });
    mobileMenu?.addEventListener("click", onMenuOverlayClick);
    reservaPanel?.addEventListener("click", onReservaOverlayClick);
    const onOpenReservaDelegated = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".js-open-reserva-panel")) return;
      onOpenReservaClick(event);
    };

    const onMobileNavRestore = () => {
      if (isMobileSiteNav()) navbar?.classList.remove("nav-hidden");
    };

    onMobileNavRestore();
    window.addEventListener("resize", onMobileNavRestore);

    openReservaPanel?.addEventListener("click", onOpenReservaClick);
    openReservaPanelFromMenu?.addEventListener("click", onOpenReservaClick);
    document.addEventListener("click", onOpenReservaDelegated);
    closeReservaPanel?.addEventListener("click", onCloseReservaClick);
    window.addEventListener("keydown", onEsc);

    const reveals = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealObserver.unobserve(e.target);
          }
        });
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px 12% 0px",
      },
    );
    reveals.forEach((r) => revealObserver.observe(r));

    return () => {
      if (lenisRafId) window.cancelAnimationFrame(lenisRafId);
      unsubscribeLenis?.();
      if (!lenis) window.removeEventListener("scroll", onNativeScroll);
      delete window.__mvLenis;
      lenis?.destroy();
      cookieAccept?.removeEventListener("click", onCookieAccept);
      cookieReject?.removeEventListener("click", onCookieReject);
      mobileMedia.removeEventListener("change", onMobileMediaChange);
      hamburger?.removeEventListener("click", toggleMenu);
      closeMenuEl?.removeEventListener("click", onCloseMenuClick);
      menuSectionLinks.forEach((link) => {
        link.removeEventListener("click", onMenuSectionClick);
      });
      mobLinks.forEach((l) => {
        const anchor = l.closest("a");
        if (anchor instanceof HTMLAnchorElement && isHomeSectionAnchor(anchor)) {
          return;
        }
        l.removeEventListener("click", onMobLinkClick);
      });
      menuPrimaryLinks.forEach((link) => {
        link.removeEventListener("mouseenter", onPrimaryHover);
        link.removeEventListener("focus", onPrimaryHover);
        link.removeEventListener("mouseleave", onPrimaryLeave);
        link.removeEventListener("blur", onPrimaryLeave);
      });
      mobileMenu?.removeEventListener("click", onMenuOverlayClick);
      reservaPanel?.removeEventListener("click", onReservaOverlayClick);
      openReservaPanel?.removeEventListener("click", onOpenReservaClick);
      openReservaPanelFromMenu?.removeEventListener("click", onOpenReservaClick);
      document.removeEventListener("click", onOpenReservaDelegated);
      closeReservaPanel?.removeEventListener("click", onCloseReservaClick);
      window.removeEventListener("keydown", onEsc);
      window.removeEventListener("resize", onMobileNavRestore);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onHashLinkClick, true);
      revealObserver.disconnect();
      navbar.classList.remove("scrolled");
      body.classList.remove("menu-open");
      body.classList.remove("reserva-open");
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.remove("reserva-open");
      resetScrollLock();
    };
  }, [router]);

  return null;
}
