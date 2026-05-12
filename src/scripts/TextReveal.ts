export interface RevealData {
  lh: number;
  lines: number;
  targetProgress?: number;
  currentProgress?: number;
  lastFullyActiveY?: number;
  lastActiveX?: number;
  lastLine?: number;
}

export class TextReveal {
  private reveals: NodeListOf<HTMLElement>;
  private revealData: Map<HTMLElement, RevealData> = new Map();
  private observer: ResizeObserver;
  private isRendering = false;

  constructor(selector = '.text-reveal') {
    this.reveals = document.querySelectorAll<HTMLElement>(selector);
    this.observer = new ResizeObserver(this.handleResize.bind(this));
    this.reveals.forEach(paragraph => {
      paragraph.style.position = 'relative';
      this.observer.observe(paragraph);

      // Set CSS variables from data-attributes for text colors
      const revealed = paragraph.getAttribute('data-revealed');
      const unrevealed = paragraph.getAttribute('data-unrevealed');
      if (revealed) paragraph.style.setProperty('--reveal-active', revealed);
      if (unrevealed) paragraph.style.setProperty('--reveal-inactive', unrevealed);

      const highlightReveal = paragraph.getAttribute('data-highlight');
      if (highlightReveal) paragraph.style.setProperty('--highlight-reveal', highlightReveal);
      const highlightUnrevealed = paragraph.getAttribute('data-highlight-unrevealed');
      if (highlightUnrevealed) paragraph.style.setProperty('--highlight-unrevealed', highlightUnrevealed);

      // Automatically add highlight class to all <span> tags inside .text-reveal
      const spans = paragraph.querySelectorAll('span');
      spans.forEach(span => {
        span.classList.add('highlight-reveal');
        // Always propagate highlight color variables from parent to span
        span.style.setProperty('--highlight-reveal', highlightReveal || '#ffd600');
        if (highlightUnrevealed) span.style.setProperty('--highlight-unrevealed', highlightUnrevealed);
      });

      // Set background color on the container if data-bg is present    
      const container = paragraph.closest('.text-reveal-container');
      if (container) {
        const bg = container.getAttribute('data-bg');
        if (bg) (container as HTMLElement).style.setProperty('--bg-color', bg);
      }
    });
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    this.calculateTargets();
    this.ensureRenderLoop();

    // Defer single-line fits to after first paint so clientWidth/scrollWidth are valid.
    requestAnimationFrame(() => {
      this.fitAllSingleLines();
      // Re-run after fonts are ready in case the webfont changes text metrics.
      document.fonts.ready.then(() => this.fitAllSingleLines());
    });
  }

  private fitAllSingleLines() {
    this.reveals.forEach(el => {
      if (el.hasAttribute('data-single-line')) {
        this.applySingleLineFit(el);
        // Recalculate line metrics now that font size is settled.
        const style = window.getComputedStyle(el);
        let lh = parseFloat(style.lineHeight);
        if (isNaN(lh)) lh = parseFloat(style.fontSize) * 1.4;
        const lines = Math.max(1, Math.round(el.offsetHeight / lh));
        const existing = this.revealData.get(el);
        const updated = { ...(existing ?? { lh, lines }), lh, lines };
        this.revealData.set(el, updated);
        el.style.setProperty('--line-height', `${lh}px`);
      }
    });
    this.calculateTargets();
  }

  private handleScroll() {
    this.calculateTargets();
    this.ensureRenderLoop();
  }

  private ensureRenderLoop() {
    if (this.isRendering) return;
    this.isRendering = true;
    requestAnimationFrame(this.renderLoop.bind(this));
  }

  private handleResize(entries: ResizeObserverEntry[]) {
    entries.forEach(entry => {
      const el = entry.target as HTMLElement;

      if (el.hasAttribute('data-single-line')) {
        this.applySingleLineFit(el);
      }

      const style = window.getComputedStyle(el);
      let lh = parseFloat(style.lineHeight);
      if (isNaN(lh)) lh = parseFloat(style.fontSize) * 1.4;
      const H = el.offsetHeight;
      const lines = Math.max(1, Math.round(H / lh));
      const revealEntry: RevealData = { lh, lines };
      this.revealData.set(el, revealEntry);
      el.style.setProperty('--line-height', `${lh}px`);
    });
    this.calculateTargets();
    this.ensureRenderLoop();
  }

  private cssLengthToPx(el: HTMLElement, value: string | null, fallbackPx: number): number {
    if (!value) return fallbackPx;

    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.width = value;
    probe.style.padding = '0';
    probe.style.border = '0';
    probe.style.margin = '0';
    el.appendChild(probe);

    const px = probe.getBoundingClientRect().width;
    probe.remove();

    return Number.isFinite(px) && px > 0 ? px : fallbackPx;
  }

  private applySingleLineFit(el: HTMLElement) {
    const computed = window.getComputedStyle(el);
    const defaultFontPx = parseFloat(computed.fontSize) || 16;

    const minPx = this.cssLengthToPx(el, el.getAttribute('data-single-line-min'), Math.max(8, defaultFontPx * 0.5));
    const maxPx = this.cssLengthToPx(el, el.getAttribute('data-single-line-max'), defaultFontPx);
    const lowerBound = Math.min(minPx, maxPx);
    const upperBound = Math.max(minPx, maxPx);

    // Grab available width before touching fontSize.
    const available = el.clientWidth;
    if (available <= 0) return;

    // overflow: hidden was removed from CSS, but temporarily lift it
    // here in case it's ever set inline, so scrollWidth is accurate.
    el.style.overflow = 'visible';
    el.style.fontSize = `${upperBound}px`;
    const contentAtMax = el.scrollWidth;
    el.style.overflow = '';

    if (contentAtMax <= 0) return;

    let fitted = upperBound * (available / contentAtMax);
    fitted = Math.max(lowerBound, Math.min(upperBound, fitted));
    el.style.fontSize = `${fitted.toFixed(2)}px`;

    // One refinement pass at the fitted size.
    el.style.overflow = 'visible';
    const fittedContent = el.scrollWidth;
    el.style.overflow = '';

    if (fitted > lowerBound && fittedContent > available + 0.5) {
      const refined = Math.max(lowerBound, fitted * (available / fittedContent));
      el.style.fontSize = `${refined.toFixed(2)}px`;
    }
  }



  private calculateTargets() {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;
    const doc = document.documentElement;
    const maxScroll = Math.max(0, doc.scrollHeight - windowHeight);

    this.reveals.forEach(paragraph => {
      const data = this.revealData.get(paragraph);
      if (!data) return;
      const rect = paragraph.getBoundingClientRect();

      // Build progress from real, reachable scroll positions.
      // This prevents elements near the page bottom from getting stuck
      // before their configured end point.
      const elementTop = rect.top + scrollY;
      const elementBottom = elementTop + rect.height;
      const startScrollPos = elementTop - windowHeight;
      let endScrollPos = Math.min(elementBottom, maxScroll);
      if (endScrollPos <= startScrollPos) endScrollPos = startScrollPos + 1;

      // Read data attributes:
      // - data-start: when animation begins (scroll progress)
      // - data-fill-start: fill amount at animation start
      // Read data attributes:
      // - data-start: when animation begins (scroll progress)
      // - data-fill-start: fill amount at animation start
      const startAttr = paragraph.getAttribute('data-start');
      const fillAttr = paragraph.getAttribute('data-fill');
      const fillStartAttr = paragraph.getAttribute('data-fill-start');

      const start = startAttr !== null ? parseFloat(startAttr) : 0.1;
      const fill = fillAttr !== null ? parseFloat(fillAttr) : 0.4;

      let fillStart = fillStartAttr !== null ? parseFloat(fillStartAttr) : 0;
      if (!Number.isFinite(fillStart)) fillStart = 0;
      fillStart = Math.max(0, Math.min(1, fillStart));

      let scrollProgress = (scrollY - startScrollPos) / (endScrollPos - startScrollPos);
      let progress = 0;

      // Default/modern behavior: progress is based on start, fill, and fillStart only.
      progress = (scrollProgress - start) / fill;
      if (progress < fillStart) progress = fillStart;
      if (progress > 1) progress = 1;

      progress = Math.max(0, Math.min(1, progress));
      data.targetProgress = progress;
      if (data.currentProgress === undefined) data.currentProgress = progress;
    });
  }

  private renderLoop() {
    let hasActiveMotion = false;

    this.reveals.forEach(paragraph => {
      const data = this.revealData.get(paragraph);
      if (!data || data.targetProgress === undefined) return;

      const delta = data.targetProgress! - data.currentProgress!;
      if (Math.abs(delta) < 0.0005) {
        data.currentProgress = data.targetProgress;
      } else {
        data.currentProgress! += delta * 0.12;
        hasActiveMotion = true;
      }

      const scaledProgress = data.currentProgress! * data.lines;
      const currentLine = Math.floor(scaledProgress);
      const fraction = scaledProgress - currentLine;
      const fullyActiveY = Number((currentLine * data.lh).toFixed(2));
      const activeX = Number((fraction * 100).toFixed(2));

      const lineChanged = data.lastLine !== currentLine;
      const fullyYChanged = data.lastFullyActiveY !== fullyActiveY;
      const activeXChanged = data.lastActiveX !== activeX;

      if (fullyYChanged) {
        paragraph.style.setProperty('--fully-active-y', `${fullyActiveY}px`);
        data.lastFullyActiveY = fullyActiveY;
      }

      if (activeXChanged) {
        paragraph.style.setProperty('--active-x', `${activeX}%`);
        data.lastActiveX = activeX;
      }

      data.lastLine = currentLine;

      // Synchronize highlight spans and their dots with the precise reveal progress
      if (lineChanged || activeXChanged) {
        const highlights = paragraph.querySelectorAll<HTMLSpanElement>(".highlight-reveal");
        const pWidth = paragraph.clientWidth;
        const currentStopPx = (activeX / 100) * pWidth;

        highlights.forEach(span => {
          const spanLine = Math.floor((span.offsetTop + span.offsetHeight / 2) / data.lh);
          let spanActiveX = 0;

          if (currentLine > spanLine) {
            spanActiveX = 100;
          } else if (currentLine < spanLine) {
            spanActiveX = 0;
          } else {
            const offsetLeft = span.offsetLeft;
            const spanWidth = span.offsetWidth;
            spanActiveX = ((currentStopPx - offsetLeft) / spanWidth) * 100;
            spanActiveX = Math.max(0, Math.min(100, spanActiveX));
          }

          span.style.setProperty('--active-x', `${spanActiveX.toFixed(2)}%`);
        });
      }

    });

    if (hasActiveMotion) {
      requestAnimationFrame(this.renderLoop.bind(this));
    } else {
      this.isRendering = false;
    }
  }
}

// Usage example (uncomment to use):
// document.addEventListener('DOMContentLoaded', () => {
//   new TextReveal();
// });
