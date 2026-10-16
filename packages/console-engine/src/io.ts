/**
 * Terminal I/O helpers for the console engine.
 * Sticky scroll + scrollback line painter. DOM nodes stay page-owned via getters.
 */

export function createStickyScroll(getScrollEl: () => { scrollHeight: number; scrollTop: number; clientHeight: number } | null | undefined) {
  let pinnedToBottom = true;

  function isPinnedToBottom(threshold = 28): boolean {
    const el = getScrollEl();
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }

  function scrollToPrompt(opts: { force?: boolean } = {}) {
    const el = getScrollEl();
    if (!el) return;
    if (opts.force || pinnedToBottom) {
      el.scrollTop = el.scrollHeight;
      pinnedToBottom = true;
    }
  }

  return {
    isPinnedToBottom,
    scrollToPrompt,
    getPinned: () => pinnedToBottom,
    setPinned: (v: boolean) => {
      pinnedToBottom = !!v;
    },
    /** Call from scroll listeners: update pin from current scroll position. */
    syncPinnedFromScroll(threshold = 28) {
      pinnedToBottom = isPinnedToBottom(threshold);
      return pinnedToBottom;
    },
  };
}

export interface ElementLike {
  insertBefore(a: unknown, b: unknown): void;
}

export type OutputCtx = {
  getScrollback: () => ElementLike | null | undefined;
  getPromptline: () => ElementLike | null | undefined;
  scrollToPrompt: (opts?: { force?: boolean }) => void;
  isCapturing: () => boolean;
  pushCapture: (chunk: string) => void;
  plainText: (html: string) => string;
  createElement?: (tag: string, opts?: { className?: string; innerHTML?: string }) => unknown;
};

export function createOutput(ctx: OutputCtx) {
  const {
    getScrollback,
    getPromptline,
    scrollToPrompt,
    isCapturing,
    pushCapture,
    plainText,
    createElement = (tag, opts) => {
      const el = document.createElement(tag);
      if (opts?.className) el.className = opts.className;
      if (opts?.innerHTML != null) el.innerHTML = opts.innerHTML;
      return el;
    },
  } = ctx;

  function out(html: string, cls?: string): void {
    if (isCapturing()) {
      pushCapture(plainText(String(html ?? "")));
      return;
    }
    const sb = getScrollback();
    const promptline = getPromptline();
    if (!sb || !promptline) return;
    const d = createElement("div", {
      className: "line" + (cls ? " " + cls : ""),
      innerHTML: html,
    });
    sb.insertBefore(d, promptline);
    scrollToPrompt();
  }

  function blank(): void {
    if (isCapturing()) {
      pushCapture("");
      return;
    }
    out("&nbsp;", "blank");
  }

  return { out, blank };
}
