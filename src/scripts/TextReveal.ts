export interface RevealData {
  lh: number;
  lines: number;
  targetProgress?: number;
  currentProgress?: number;
  dotOffsetLeft?: number;
}

export class TextReveal {
  private reveals: NodeListOf<HTMLElement>;
  private revealData: Map<HTMLElement, RevealData> = new Map();
  private observer: ResizeObserver;

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

      // Automatically add highlight class to all <span> tags inside .text-reveal
      const spans = paragraph.querySelectorAll('span');
      spans.forEach(span => {
        span.classList.add('highlight-reveal');
        // Always propagate highlight color variables from parent to span
        span.style.setProperty('--highlight-reveal', highlightReveal || '#ffd600');
      });

      // Set background color on the container if data-bg is present    
      const container = paragraph.closest('.text-reveal-container');
      if (container) {
        const bg = container.getAttribute('data-bg');
        if (bg) (container as HTMLElement).style.setProperty('--bg-color', bg);
      }
    });
    window.addEventListener('scroll', this.calculateTargets.bind(this), { passive: true });
    this.calculateTargets();
    requestAnimationFrame(this.renderLoop.bind(this));
  }

  private handleResize(entries: ResizeObserverEntry[]) {
    entries.forEach(entry => {
      const el = entry.target as HTMLElement;
      const style = window.getComputedStyle(el);
      let lh = parseFloat(style.lineHeight);
      if (isNaN(lh)) lh = parseFloat(style.fontSize) * 1.4;
      const H = el.offsetHeight;
      const lines = Math.max(1, Math.round(H / lh));
      const revealEntry: RevealData = { lh, lines };
      if (el.hasAttribute('data-dot')) {
        revealEntry.dotOffsetLeft = this.measureDotOffset(el);
      }
      this.revealData.set(el, revealEntry);
      el.style.setProperty('--line-height', `${lh}px`);
    });
    this.calculateTargets();
  }

  private measureDotOffset(el: HTMLElement): number {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = range.getClientRects();
    if (rects.length === 0) return el.clientWidth;
    const lastRect = rects[rects.length - 1];
    const pRect = el.getBoundingClientRect();
    return lastRect.right - pRect.left;
  }

  private calculateTargets() {
    const windowHeight = window.innerHeight;
    this.reveals.forEach(paragraph => {
      const data = this.revealData.get(paragraph);
      if (!data) return;
      const rect = paragraph.getBoundingClientRect();
      const totalDistance = windowHeight + rect.height;
      const scrolled = windowHeight - rect.top;
      let progress = scrolled / totalDistance;
      progress = (progress - 0.1) / 0.4;
      //The - 0.1 means the reveal starts when the element is 10% into the scroll.
      //The / 0.4 means the reveal completes after 40% of the scroll.
      
      progress = Math.max(0, Math.min(1, progress));
      data.targetProgress = progress;
      if (data.currentProgress === undefined) data.currentProgress = progress;
    });
  }

  private renderLoop() {
    this.reveals.forEach(paragraph => {
      const data = this.revealData.get(paragraph);
      if (!data || data.targetProgress === undefined) return;
      data.currentProgress! += (data.targetProgress! - data.currentProgress!) * 0.12;
      const scaledProgress = data.currentProgress! * data.lines;
      const currentLine = Math.floor(scaledProgress);
      const fraction = scaledProgress - currentLine;
      const fullyActiveY = currentLine * data.lh;
      const activeX = fraction * 100;
      paragraph.style.setProperty('--fully-active-y', `${fullyActiveY}px`);
      paragraph.style.setProperty('--active-x', `${activeX}%`);

      // Synchronize highlight spans and their dots with the precise reveal progress
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

        span.style.setProperty('--active-x', `${spanActiveX}%`);
      });

      // Handle dot reveal — set --dot-active-x on the paragraph so ::after inherits it
      if (paragraph.hasAttribute('data-dot')) {
        const lastLine = data.lines - 1;
        let dotActiveX = 0;
        if (currentLine > lastLine) {
          dotActiveX = 100;
        } else if (currentLine === lastLine) {
          const dotOffsetLeft = data.dotOffsetLeft ?? pWidth;
          const dotWidth = 5;
          dotActiveX = ((currentStopPx - dotOffsetLeft) / dotWidth) * 100;
          dotActiveX = Math.max(0, Math.min(100, dotActiveX));
        }
        paragraph.style.setProperty('--dot-active-x', `${dotActiveX}%`);
      }
    });
    requestAnimationFrame(this.renderLoop.bind(this));
  }
}

// Usage example (uncomment to use):
// document.addEventListener('DOMContentLoaded', () => {
//   new TextReveal();
// });
