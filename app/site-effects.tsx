"use client";

import { useEffect } from "react";
import Lenis from "lenis";

import { lockScroll, resetScrollLock, unlockScroll } from "@/lib/scroll-lock";

/**
 * Maneja UI global que existe en todas las páginas (nav, menú móvil,
 * panel de reserva, banner de cookies, smooth scroll). Las animaciones
 * específicas de la home se quedan en `<HomeEffects />`.
 */
export function SiteEffects() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const body = document.body;
    const cookieBanner = document.getElementById("cookieBanner");
    const cookieAccept = document.getElementById("cookieAccept");
    const cookieReject = document.getElementById("cookieReject");
    const cookieConsentName = "mv_cookie_consent";
    const cookieConsentMaxAgeSec = 60 * 60 * 24 * 180;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let lenis: Lenis | null = null;
    let lenisRafId: number | undefined;

    if (!prefersReducedMotion) {
      const lenisEase = (t: number) => 1 - Math.pow(1 - t, 3);
      lenis = new Lenis({
        duration: 1.08,
        easing: lenisEase,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        /**
         * Enlaces # (p. ej. hero → concepto) con scroll animado;
         * `html` usa `scroll-behavior: auto` con Lenis.
         */
        anchors: {
          duration: 1.55,
          easing: lenisEase,
        },
      });

      const lenisRaf = (time: number) => {
        lenis?.raf(time);
        lenisRafId = window.requestAnimationFrame(lenisRaf);
      };
      lenisRafId = window.requestAnimationFrame(lenisRaf);
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
      dispatchMvScroll(scrollY);
    };

    let unsubscribeLenis: (() => void) | undefined;
    const onNativeScroll = () => onScroll(window.scrollY);
    if (lenis) {
      unsubscribeLenis = lenis.on("scroll", () => onScroll(lenis.scroll));
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
      mobileMenu.classList.add("open");
      mobileMenu.setAttribute("aria-hidden", "false");
      hamburger?.setAttribute("aria-expanded", "true");
      body.classList.add("menu-open");
      document.documentElement.classList.add("menu-open");
      lockScroll();
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
    const openReservaPanelFn = () => {
      if (!reservaPanel) return;
      if (reservaPanel.classList.contains("open")) return;
      if (mobileMenu?.classList.contains("open")) {
        closeMenuFn(true);
      } else {
        lockScroll();
      }
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
    };
    const onReservaOverlayClick = (event: MouseEvent) => {
      if (event.target === reservaPanel) closeReservaPanelFn();
    };
    const onOpenReservaClick = (event: Event) => {
      event.preventDefault();
      openReservaPanelFn();
    };
    const onCloseMenuClick = () => closeMenuFn();
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

    hamburger?.addEventListener("click", toggleMenu);
    closeMenuEl?.addEventListener("click", onCloseMenuClick);
    mobLinks.forEach((l) => l.addEventListener("click", onCloseMenuClick));
    menuPrimaryLinks.forEach((link) => {
      link.addEventListener("mouseenter", onPrimaryHover);
      link.addEventListener("focus", onPrimaryHover);
      link.addEventListener("mouseleave", onPrimaryLeave);
      link.addEventListener("blur", onPrimaryLeave);
    });
    mobileMenu?.addEventListener("click", onMenuOverlayClick);
    reservaPanel?.addEventListener("click", onReservaOverlayClick);
    openReservaPanel?.addEventListener("click", onOpenReservaClick);
    openReservaPanelFromMenu?.addEventListener("click", onOpenReservaClick);
    closeReservaPanel?.addEventListener("click", closeReservaPanelFn);
    window.addEventListener("keydown", onEsc);

    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    reveals.forEach((r) => observer.observe(r));

    return () => {
      if (lenisRafId) window.cancelAnimationFrame(lenisRafId);
      unsubscribeLenis?.();
      if (!lenis) window.removeEventListener("scroll", onNativeScroll);
      lenis?.destroy();
      cookieAccept?.removeEventListener("click", onCookieAccept);
      cookieReject?.removeEventListener("click", onCookieReject);
      hamburger?.removeEventListener("click", toggleMenu);
      closeMenuEl?.removeEventListener("click", onCloseMenuClick);
      mobLinks.forEach((l) => l.removeEventListener("click", onCloseMenuClick));
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
      closeReservaPanel?.removeEventListener("click", closeReservaPanelFn);
      window.removeEventListener("keydown", onEsc);
      observer.disconnect();
      navbar.classList.remove("scrolled");
      body.classList.remove("menu-open");
      body.classList.remove("reserva-open");
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.remove("reserva-open");
      resetScrollLock();
    };
  }, []);

  return null;
}
