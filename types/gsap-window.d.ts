declare global {
  interface Window {
    gsap?: {
      registerPlugin: (...plugins: unknown[]) => void;
      timeline: (vars?: Record<string, unknown>) => {
        kill: () => void;
        to: (
          target: unknown,
          vars: Record<string, unknown>,
          position?: number | string,
        ) => unknown;
        fromTo: (
          target: unknown,
          fromVars: Record<string, unknown>,
          toVars: Record<string, unknown>,
          position?: number | string,
        ) => unknown;
        set: (
          target: unknown,
          vars: Record<string, unknown>,
          position?: number | string,
        ) => unknown;
      };
      set: (target: unknown, vars: Record<string, unknown>) => void;
      quickSetter: (
        target: unknown,
        property: string,
        unit?: string,
      ) => (value: number) => void;
      to: (
        target: unknown,
        vars: Record<string, unknown>,
      ) => unknown;
      utils: {
        toArray: <T extends Element>(target: unknown) => T[];
      };
    };
    ScrollTrigger?: {
      registerPlugin: (...plugins: unknown[]) => void;
      refresh: () => void;
      getAll: () => Array<{ kill: () => void; vars: { trigger?: Element } }>;
      getById: (id: string) =>
        | {
            kill: (reset?: boolean) => void;
            start: number;
            end: number;
            progress: number;
            scroll: (position: number) => void;
            disable: (reset?: boolean, suppressCallbacks?: boolean) => void;
            enable: (reset?: boolean, suppressCallbacks?: boolean) => void;
          }
        | undefined;
      create: (vars: Record<string, unknown>) => {
        kill: (reset?: boolean) => void;
        start: number;
        end: number;
        progress: number;
      };
      scrollerProxy: (
        element: Element,
        vars: Record<string, unknown>,
      ) => void;
      addEventListener: (type: string, callback: () => void) => void;
      update: () => void;
    };
    __mvLenis?: import("lenis").default;
    __mvScrollTriggerLenis?: boolean;
    __mvScrollLayoutSyncPending?: boolean;
  }
}

export {};
