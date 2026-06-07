"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  mvcareFeatures,
  mvcareFeaturesSection,
} from "@/lib/mvcare-content";

const SLIDE_COUNT = mvcareFeatures.length;

function lineFitsInContainer(container: HTMLElement, text: string): boolean {
  container.replaceChildren();
  container.append(document.createTextNode(text));
  return container.scrollWidth <= container.clientWidth + 2;
}

function countWords(line: string): number {
  return line.trim().split(/ +/).filter(Boolean).length;
}

function joinWords(words: string[], start: number, end: number): string {
  return words.slice(start, end).join(" ");
}

function splitWordsIntoLines(
  container: HTMLElement,
  words: string[],
): string[] {
  const total = words.length;
  if (total === 0) return [];
  if (total === 1) return [words[0]];

  const lines: string[] = [];
  let start = 0;

  while (start < total) {
    let end = start + 1;
    let lastFit = start + 1;

    while (end <= total) {
      if (lineFitsInContainer(container, joinWords(words, start, end))) {
        lastFit = end;
        end += 1;
      } else {
        break;
      }
    }

    let breakAt = lastFit;

    while (breakAt < total && total - breakAt === 1 && breakAt > start + 1) {
      breakAt -= 1;
    }

    if (breakAt - start === 1 && breakAt < total) {
      const extended = Math.min(start + 2, lastFit);
      if (
        extended > breakAt &&
        lineFitsInContainer(container, joinWords(words, start, extended))
      ) {
        breakAt = extended;
        while (
          breakAt < total &&
          total - breakAt === 1 &&
          breakAt > start + 1
        ) {
          breakAt -= 1;
        }
      }
    }

    lines.push(joinWords(words, start, breakAt));
    start = breakAt;
  }

  return optimizeLineBreaks(lines, container);
}

function optimizeLineBreaks(
  lines: string[],
  container: HTMLElement,
): string[] {
  let result = [...lines];
  let changed = true;
  let passes = 0;

  while (changed && passes < 24) {
    changed = false;
    passes += 1;

    for (let i = 0; i < result.length; i += 1) {
      if (countWords(result[i]) !== 1) continue;

      if (i > 0) {
        const mergedWithPrevious = `${result[i - 1]} ${result[i]}`.trim();
        if (lineFitsInContainer(container, mergedWithPrevious)) {
          result.splice(i - 1, 2, mergedWithPrevious);
          changed = true;
          break;
        }

        const previousWords = result[i - 1].trim().split(/ +/).filter(Boolean);
        if (previousWords.length >= 2) {
          const moved = previousWords.pop()!;
          const nextPrevious = previousWords.join(" ");
          const nextCurrent = `${moved} ${result[i]}`.trim();

          if (
            lineFitsInContainer(container, nextPrevious) &&
            lineFitsInContainer(container, nextCurrent) &&
            countWords(nextPrevious) >= 2
          ) {
            result[i - 1] = nextPrevious;
            result[i] = nextCurrent;
            changed = true;
            break;
          }
        }
      }

      if (i < result.length - 1) {
        const mergedWithNext = `${result[i]} ${result[i + 1]}`.trim();
        if (lineFitsInContainer(container, mergedWithNext)) {
          result.splice(i, 2, mergedWithNext);
          changed = true;
          break;
        }
      }
    }

    if (changed) continue;

    for (let i = 0; i < result.length - 1; i += 1) {
      if (countWords(result[i + 1]) > 3) continue;

      const previousWords = result[i].trim().split(/ +/).filter(Boolean);
      if (previousWords.length <= 2) continue;

      const moved = previousWords.pop()!;
      const nextPrevious = previousWords.join(" ");
      const nextCurrent = `${moved} ${result[i + 1]}`.trim();

      if (
        lineFitsInContainer(container, nextPrevious) &&
        lineFitsInContainer(container, nextCurrent) &&
        countWords(nextPrevious) >= 2
      ) {
        result[i] = nextPrevious;
        result[i + 1] = nextCurrent;
        changed = true;
        break;
      }
    }
  }

  return result;
}

function splitTextIntoLines(container: HTMLElement, text: string): string[] {
  const words = text.trim().split(/ +/).filter(Boolean);
  return splitWordsIntoLines(container, words);
}

type MvcareFeaturesSlideCopyProps = {
  title: string;
  description: string;
  animate: boolean;
};

function MvcareFeaturesSlideCopy({
  title,
  description,
  animate,
}: MvcareFeaturesSlideCopyProps) {
  const titleMeasureRef = useRef<HTMLHeadingElement>(null);
  const descMeasureRef = useRef<HTMLParagraphElement>(null);
  const [titleLines, setTitleLines] = useState<string[]>([title]);
  const [descLines, setDescLines] = useState<string[]>([description]);

  const measureLines = useCallback(() => {
    const titleEl = titleMeasureRef.current;
    const descEl = descMeasureRef.current;
    if (!titleEl || !descEl) return;
    if (titleEl.clientWidth === 0 || descEl.clientWidth === 0) return;

    setTitleLines(splitTextIntoLines(titleEl, title));
    setDescLines(splitTextIntoLines(descEl, description));
  }, [title, description]);

  useLayoutEffect(() => {
    measureLines();
  }, [measureLines]);

  useEffect(() => {
    const measureRoot = descMeasureRef.current?.parentElement;
    if (!measureRoot) return;

    const observer = new ResizeObserver(() => {
      measureLines();
    });
    observer.observe(measureRoot);

    window.addEventListener("resize", measureLines);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureLines);
    };
  }, [measureLines]);

  let lineIndex = 0;

  return (
    <article className="mvcare-features__copy-panel" aria-live="polite">
      <div
        className="mvcare-features__line-measure"
        aria-hidden={true}
      >
        <h3
          ref={titleMeasureRef}
          className="mvcare-features__slide-title"
        >
          {title}
        </h3>
        <p
          ref={descMeasureRef}
          className="section-body mvcare-features__slide-desc"
        >
          {description}
        </p>
      </div>

      <div className="mvcare-features__slide-title-block">
        {titleLines.map((line, lineOffset) => {
          const delayIndex = lineIndex;
          lineIndex += 1;
          return (
            <div
              key={`title-${lineOffset}`}
              className="mvcare-features__line-wrap"
            >
              <span
                className={`mvcare-features__line mvcare-features__line--title${
                  animate ? " is-entering" : ""
                }`}
                style={
                  {
                    "--line-i": delayIndex,
                  } as React.CSSProperties
                }
              >
                {line}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mvcare-features__slide-desc-block">
        {descLines.map((line, lineOffset) => {
          const delayIndex = lineIndex;
          lineIndex += 1;
          return (
            <div
              key={`desc-${lineOffset}`}
              className="mvcare-features__line-wrap"
            >
              <span
                className={`mvcare-features__line mvcare-features__line--desc section-body${
                  animate ? " is-entering" : ""
                }`}
                style={
                  {
                    "--line-i": delayIndex,
                  } as React.CSSProperties
                }
              >
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

type CarouselArrowProps = {
  direction: "prev" | "next";
  onClick: () => void;
};

function CarouselArrow({ direction, onClick }: CarouselArrowProps) {
  const src =
    direction === "prev"
      ? "/assets/images/iconos/arrow-left.svg"
      : "/assets/images/iconos/arrow-right.svg";
  const label =
    direction === "prev" ? "Diapositiva anterior" : "Diapositiva siguiente";

  return (
    <button
      type="button"
      className="mvcare-features__arrow servicio__scroll-cta"
      aria-label={label}
      onClick={onClick}
    >
      <span className="servicio__scroll-cta-inner">
        <svg
          className="servicio__scroll-cta-ring"
          viewBox="0 0 100 100"
          aria-hidden={true}
        >
          <circle
            className="servicio__scroll-cta-ring-path"
            cx="50"
            cy="50"
            r="49.5"
          />
        </svg>
        <span className="servicio__scroll-cta-arrow-wrap" aria-hidden={true}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            width={14}
            height={14}
            className="servicio__scroll-cta-arrow mvcare-features__arrow-icon"
          />
        </span>
      </span>
    </button>
  );
}

export function MvcareFeaturesCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [slideEpoch, setSlideEpoch] = useState(0);
  const [isNumeralTransitioning, setIsNumeralTransitioning] = useState(false);

  const go = useCallback((delta: number) => {
    setIndex((current) => {
      setPrevIndex(current);
      return (current + delta + SLIDE_COUNT) % SLIDE_COUNT;
    });
    setSlideEpoch((epoch) => epoch + 1);
    setIsNumeralTransitioning(true);
  }, []);

  useEffect(() => {
    if (!isNumeralTransitioning) return;

    const timeoutId = window.setTimeout(() => {
      setIsNumeralTransitioning(false);
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [isNumeralTransitioning, index]);

  useEffect(() => {
    const root = carouselRef.current;
    if (!root) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (!root.matches(":hover") && !root.contains(document.activeElement)) {
        return;
      }
      event.preventDefault();
      go(event.key === "ArrowLeft" ? -1 : 1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const secondaryIndex = (index + 1) % SLIDE_COUNT;
  const prevSecondaryIndex = (prevIndex + 1) % SLIDE_COUNT;
  const isSlideAnimating = slideEpoch > 0;

  return (
    <section
      className="mvcare-section mvcare-section--light mvcare-features"
      aria-labelledby="mvcare-features-title"
      aria-roledescription="carrusel"
    >
      <div className="mvcare-section__inner mvcare-features__inner">
        <header className="mvcare-features__masthead">
          <h2
            id="mvcare-features-title"
            className="servicios-heading__title mvcare-features__masthead-title mvcare-title-display"
          >
            <span className="mvcare-title-reveal">
              {mvcareFeaturesSection.masthead}
            </span>
          </h2>
          <p className="mvcare-features__masthead-sub">
            <span className="mvcare-features__masthead-sub-line">
              {mvcareFeaturesSection.subtitleLine1}
            </span>
            <span className="mvcare-features__masthead-sub-line">
              {mvcareFeaturesSection.subtitleLine2}
            </span>
          </p>
        </header>

        <div
          ref={carouselRef}
          className="mvcare-features__carousel"
          role="region"
          aria-label="Funciones de MV Care"
          tabIndex={0}
        >
          <div className="mvcare-features__body">
            <div className="mvcare-features__copy-col">
              <div className="mvcare-features__copy-foot">
                <div className="mvcare-features__nav">
                  <CarouselArrow direction="prev" onClick={() => go(-1)} />
                  <CarouselArrow direction="next" onClick={() => go(1)} />
                </div>

                <div className="mvcare-features__copy-viewport">
                  <MvcareFeaturesSlideCopy
                    key={index}
                    title={mvcareFeatures[index].title}
                    description={mvcareFeatures[index].description}
                    animate={isSlideAnimating}
                  />
                </div>
              </div>
            </div>

            <div className="mvcare-features__visual-col">
              <div
                className="mvcare-features__numeral-stack"
                aria-live="polite"
                aria-atomic={true}
              >
                {mvcareFeatures.map((feature, slideIndex) => {
                  const isActive = slideIndex === index;
                  const isPrevious =
                    isNumeralTransitioning &&
                    slideIndex === prevIndex &&
                    !isActive;

                  if (!isActive && !isPrevious) {
                    return null;
                  }

                  return (
                    <span
                      key={feature.title}
                      className={`mvcare-features__numeral-clip${
                        isActive ? " is-active" : ""
                      }`}
                      aria-hidden={!isActive}
                    >
                      <span
                        className={`mvcare-features__numeral-reveal${
                          isNumeralTransitioning && isActive
                            ? " is-entering"
                            : ""
                        }${isPrevious ? " is-exiting" : ""}`}
                      >
                        <span className="mvcare-features__numeral">
                          {slideIndex + 1}
                        </span>
                      </span>
                    </span>
                  );
                })}
              </div>

              <div className="mvcare-features__images">
                <div className="mvcare-features__image-col mvcare-features__image-col--main">
                  <div className="mvcare-features__image-stack mvcare-features__image-stack--main">
                    {mvcareFeatures.map((feature, slideIndex) => {
                      const isActive = slideIndex === index;
                      const isPrevious =
                        isSlideAnimating &&
                        slideIndex === prevIndex &&
                        !isActive;

                      if (!isActive && !isPrevious) {
                        return null;
                      }

                      return (
                        <div
                          key={feature.image}
                          className={`mvcare-features__image-layer mvcare-features__image-layer--main${
                            isActive ? " is-active" : ""
                          }${
                            isSlideAnimating && isActive ? " is-entering" : ""
                          }${isPrevious ? " is-exiting" : ""}`}
                          aria-hidden={!isActive}
                        >
                          <Image
                            src={feature.image}
                            alt={isActive ? feature.imageAlt : ""}
                            fill
                            className="mvcare-features__image"
                            sizes="(min-width: 900px) 722px, 52vw"
                            priority={slideIndex === 0}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mvcare-features__image-col mvcare-features__image-col--secondary">
                  <div className="mvcare-features__image-stack mvcare-features__image-stack--secondary">
                    {mvcareFeatures.map((feature, slideIndex) => {
                      const isActive = slideIndex === secondaryIndex;
                      const isPrevious =
                        isSlideAnimating &&
                        slideIndex === prevSecondaryIndex &&
                        !isActive;

                      if (!isActive && !isPrevious) {
                        return null;
                      }

                      return (
                        <div
                          key={feature.image}
                          className={`mvcare-features__image-layer mvcare-features__image-layer--secondary${
                            isActive ? " is-active" : ""
                          }${
                            isSlideAnimating && isActive ? " is-entering" : ""
                          }${isPrevious ? " is-exiting" : ""}`}
                          aria-hidden={!isActive}
                        >
                          <Image
                            src={feature.image}
                            alt=""
                            fill
                            className="mvcare-features__image"
                            sizes="(max-width: 899px) 92vw, 28vw"
                            aria-hidden={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
