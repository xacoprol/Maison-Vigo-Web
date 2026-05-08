"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function HomeEffects() {
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const heroSection = document.getElementById("hero");
    const conceptoSection = document.getElementById("concepto");
    const body = document.body;
    const introEl = document.getElementById("logoIntro");
    /** Piezas terminan ~3.5s → vuelo inmediato */
    const introLogoFlightMs = 3500;
    /** Si no llega animationend (raro), cerrar intro igualmente */
    const introCompleteFallbackMs = introLogoFlightMs + 2600;
    /** Solo si falla la medición del wordmark del nav antes del vuelo */
    const introFlightEndScaleFallback = 0.33;
    const introSeenCookie = "mv_intro_seen";
    const introSeenMaxAgeSec = 60 * 60 * 24;
    const cookieConsentName = "mv_cookie_consent";
    const cookieConsentMaxAgeSec = 60 * 60 * 24 * 180;
    const cookieBanner = document.getElementById("cookieBanner");
    const cookieAccept = document.getElementById("cookieAccept");
    const cookieReject = document.getElementById("cookieReject");

    const unionBounds = (rects: DOMRect[]) => {
      if (!rects.length) return null;
      return rects.reduce(
        (acc, rect) => ({
          left: Math.min(acc.left, rect.left),
          top: Math.min(acc.top, rect.top),
          right: Math.max(acc.right, rect.right),
          bottom: Math.max(acc.bottom, rect.bottom),
        }),
        {
          left: rects[0].left,
          top: rects[0].top,
          right: rects[0].right,
          bottom: rects[0].bottom,
        },
      );
    };

    const setIntroTarget = () => {
      if (!introEl) return;
      if (introEl.classList.contains("logo-intro--fly")) return;
      const introPieces = Array.from(
        introEl.querySelectorAll<HTMLElement>(".logo-intro-piece"),
      );
      if (!introPieces.length) return;

      const introRects = introPieces.map((piece) => piece.getBoundingClientRect());
      const introUnion = unionBounds(introRects);
      if (!introUnion) return;

      const introWordmark = introEl.querySelector<HTMLElement>(
        ".logo-intro-piece--two",
      );
      const navWordmark = navbar.querySelector<HTMLElement>(
        ".nav-brand-piece--two",
      );
      const tw = introWordmark?.getBoundingClientRect();
      const nw = navWordmark?.getBoundingClientRect();

      let alignIntroCx = introUnion.left + (introUnion.right - introUnion.left) / 2;
      let alignIntroCy = introUnion.top + (introUnion.bottom - introUnion.top) / 2;
      if (tw && tw.width > 0) {
        alignIntroCx = tw.left + tw.width / 2;
        alignIntroCy = tw.top + tw.height / 2;
      }

      let alignNavCx: number;
      let alignNavCy: number;
      let targetScale = introFlightEndScaleFallback;

      if (tw && tw.width > 0 && nw && nw.width > 0) {
        /** Misma anchura visual que el wordmark del header: no “crece” al cambiar al nav */
        targetScale = nw.width / tw.width;
        alignNavCx = nw.left + nw.width / 2;
        alignNavCy = nw.top + nw.height / 2;
      } else {
        const brandSlot =
          navbar.querySelector<HTMLElement>("a.nav-brand") ?? navbar;
        const slot = brandSlot.getBoundingClientRect();
        if (slot.width <= 0 || slot.height <= 0) return;
        alignNavCx = slot.left + slot.width / 2;
        alignNavCy = slot.top + slot.height / 2;
      }

      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;
      const targetX =
        alignNavCx - viewportCenterX - (alignIntroCx - viewportCenterX) * targetScale;
      const targetY =
        alignNavCy - viewportCenterY - (alignIntroCy - viewportCenterY) * targetScale;
      introEl.style.setProperty("--logo-intro-target-x", `${targetX}px`);
      introEl.style.setProperty("--logo-intro-target-y", `${targetY}px`);
      introEl.style.setProperty("--logo-intro-target-scale", `${targetScale}`);
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let lenis: Lenis | null = null;
    let lenisRafId: number | undefined;

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        duration: 1.08,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
      });

      const lenisRaf = (time: number) => {
        lenis?.raf(time);
        lenisRafId = window.requestAnimationFrame(lenisRaf);
      };
      lenisRafId = window.requestAnimationFrame(lenisRaf);
    }

    let introCompleteFallbackTimer: number | undefined;
    let flightTimer: number | undefined;
    let onResizeIntro: (() => void) | undefined;
    let introFinished = false;
    let introStarted = false;
    let lockedScrollY = 0;
    let prevBodyPosition = "";
    let prevBodyTop = "";
    let prevBodyLeft = "";
    let prevBodyRight = "";
    let prevBodyWidth = "";
    let prevBodyOverflow = "";
    let prevBodyPaddingRight = "";
    let isScrollLocked = false;
    let scrollLockCount = 0;

    const hasSeenIntroRecently = () => {
      return document.cookie
        .split(";")
        .map((part) => part.trim())
        .some((part) => part === `${introSeenCookie}=1`);
    };

    const getCookie = (name: string) => {
      const found = document.cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`));
      return found ? decodeURIComponent(found.split("=")[1] ?? "") : "";
    };

    const setIntroSeenCookie = () => {
      document.cookie = `${introSeenCookie}=1; Max-Age=${introSeenMaxAgeSec}; Path=/; SameSite=Lax`;
    };

    const setCookieConsent = (value: "accepted" | "rejected") => {
      document.cookie = `${cookieConsentName}=${value}; Max-Age=${cookieConsentMaxAgeSec}; Path=/; SameSite=Lax`;
    };

    const hideCookieBanner = () => {
      cookieBanner?.classList.add("cookie-banner--hidden");
    };

    const applyScrollLock = () => {
      if (isScrollLocked) return;
      isScrollLocked = true;
      lockedScrollY = window.scrollY;
      const scrollbarWidth = Math.max(
        window.innerWidth - document.documentElement.clientWidth,
        0,
      );
      prevBodyPosition = document.body.style.position;
      prevBodyTop = document.body.style.top;
      prevBodyLeft = document.body.style.left;
      prevBodyRight = document.body.style.right;
      prevBodyWidth = document.body.style.width;
      prevBodyOverflow = document.body.style.overflow;
      prevBodyPaddingRight = document.body.style.paddingRight;
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    };

    const clearScrollLock = () => {
      if (!isScrollLocked) return;
      isScrollLocked = false;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.paddingRight = prevBodyPaddingRight;
      window.scrollTo(0, lockedScrollY);
    };

    const lockScroll = () => {
      scrollLockCount += 1;
      if (scrollLockCount === 1) {
        applyScrollLock();
      }
    };

    const unlockScroll = () => {
      if (scrollLockCount === 0) return;
      scrollLockCount -= 1;
      if (scrollLockCount === 0) {
        clearScrollLock();
      }
    };

    const resetScrollLock = () => {
      scrollLockCount = 0;
      clearScrollLock();
    };

    const finishIntro = () => {
      if (introFinished || !introEl) return;
      introFinished = true;
      if (introCompleteFallbackTimer) {
        window.clearTimeout(introCompleteFallbackTimer);
      }
      introEl.removeEventListener("animationend", onIntroFlyEnd);
      /**
       * `intro-complete` antes que quitar `intro-active`: si no, deja de aplicarse
       * `logoIntroMove` y el transform del overlay vuelve a identidad un instante
       * antes de `display:none` → flash/salto al mostrar el nav.
       */
      body.classList.add("intro-complete");
      body.classList.remove("intro-active");
      body.classList.remove("intro-logo-flight");
      unlockScroll();
      if (introStarted) {
        setIntroSeenCookie();
      }
    };

    const onIntroFlyEnd = (e: AnimationEvent) => {
      if (e.animationName !== "logoIntroMove") return;
      requestAnimationFrame(() => {
        requestAnimationFrame(finishIntro);
      });
    };

    const skipIntro = prefersReducedMotion || hasSeenIntroRecently();
    if (skipIntro) {
      body.classList.add("intro-complete");
    } else if (introEl) {
      introStarted = true;
      body.classList.add("intro-active");
      lockScroll();
      requestAnimationFrame(() => {
        introEl.classList.add("is-playing");
      });
      flightTimer = window.setTimeout(() => {
        requestAnimationFrame(() => {
          setIntroTarget();
          introEl.addEventListener("animationend", onIntroFlyEnd);
          introEl.classList.add("logo-intro--fly");
          body.classList.add("intro-logo-flight");
        });
      }, introLogoFlightMs);
      introCompleteFallbackTimer = window.setTimeout(
        finishIntro,
        introCompleteFallbackMs,
      );
      onResizeIntro = () => {
        if (!introEl || introEl.classList.contains("logo-intro--fly")) return;
        setIntroTarget();
      };
      window.addEventListener("resize", onResizeIntro);
    } else {
      body.classList.add("intro-complete");
    }

    const cookieConsent = getCookie(cookieConsentName);
    if (cookieConsent === "accepted" || cookieConsent === "rejected") {
      hideCookieBanner();
    }

    const onScroll = () => {
      navbar.classList.toggle("scrolled", window.scrollY > 40);
      if (heroSection) {
        const maxScroll = Math.max(heroSection.clientHeight * 0.78, 1);
        const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        heroSection.style.setProperty("--hero-scroll-progress", progress.toFixed(3));
      }
      if (conceptoSection) {
        const rect = conceptoSection.getBoundingClientRect();
        const centerDelta =
          window.innerHeight * 0.5 - (rect.top + rect.height * 0.5);
        const conceptProgress = Math.min(
          Math.max(centerDelta / (window.innerHeight * 0.55), -1),
          1,
        );
        conceptoSection.style.setProperty(
          "--concepto-parallax-progress",
          conceptProgress.toFixed(3),
        );
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();

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
      if (event.target === mobileMenu) {
        closeMenuFn();
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (reservaPanel?.classList.contains("open")) {
          closeReservaPanelFn();
          return;
        }
        closeMenuFn();
      }
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
      if (event.target === reservaPanel) {
        closeReservaPanelFn();
      }
    };
    const onOpenReservaClick = (event: Event) => {
      event.preventDefault();
      openReservaPanelFn();
    };
    const onCloseMenuClick = () => closeMenuFn();
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
    const onPrimaryLeave = () => {
      setMenuImage("foto1");
    };

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
      if (introCompleteFallbackTimer) {
        window.clearTimeout(introCompleteFallbackTimer);
      }
      if (flightTimer) {
        window.clearTimeout(flightTimer);
      }
      if (introEl) {
        introEl.removeEventListener("animationend", onIntroFlyEnd);
      }
      resetScrollLock();
      body.classList.remove("intro-active");
      body.classList.remove("intro-logo-flight");
      if (introEl) {
        introEl.classList.remove("is-playing");
        introEl.classList.remove("logo-intro--fly");
      }
      if (onResizeIntro) {
        window.removeEventListener("resize", onResizeIntro);
      }
      if (lenisRafId) {
        window.cancelAnimationFrame(lenisRafId);
      }
      lenis?.destroy();
      window.removeEventListener("scroll", onScroll);
      if (heroSection) {
        heroSection.style.setProperty("--hero-scroll-progress", "0");
      }
      if (conceptoSection) {
        conceptoSection.style.setProperty("--concepto-parallax-progress", "0");
      }
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
      body.classList.remove("menu-open");
      body.classList.remove("reserva-open");
      document.documentElement.classList.remove("menu-open");
      document.documentElement.classList.remove("reserva-open");
      cookieAccept?.removeEventListener("click", onCookieAccept);
      cookieReject?.removeEventListener("click", onCookieReject);
      observer.disconnect();
    };
  }, []);

  return null;
}
