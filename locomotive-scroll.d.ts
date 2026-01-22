declare module 'locomotive-scroll' {
  export interface LocomotiveScrollOptions {
    el?: HTMLElement | string | null;
    smooth?: boolean;
    [key: string]: any;
  }

  export interface LocomotiveScrollInstance {
    scroll: {
      instance: {
        scroll: {
          y: number;
        };
      };
    };
    scrollTo(value: number, duration?: number, easing?: number): void;
    on(event: string, callback: () => void): void;
    update(): void;
    destroy(): void;
  }

  export default class LocomotiveScroll {
    constructor(options?: LocomotiveScrollOptions);
    scroll: {
      instance: {
        scroll: {
          y: number;
        };
      };
    };
    scrollTo(value: number, duration?: number, easing?: number): void;
    on(event: string, callback: () => void): void;
    update(): void;
    destroy(): void;
  }
}
