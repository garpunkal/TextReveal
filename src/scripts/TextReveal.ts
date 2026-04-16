export interface RevealData {
  lh: number;
  lines: number;
  targetProgress?: number;
  currentProgress?: number;
}

export class TextReveal {
  private reveals: NodeListOf<HTMLElement>;
  private revealData: Map<HTMLElement, RevealData> = new Map();
  private observer: ResizeObserver;

  constructor(selector = '.text-reveal') {
    this.reveals = document.querySelectorAll<HTMLElement>(selector);
    this.observer = new ResizeObserver(this.handleResize.bind(this));
    this.reveals.forEach(paragraph => {
      this.observer.observe(paragraph);

      // Set CSS variables from data-attributes for text colors
      const revealed = paragraph.getAttribute('data-revealed');
      const unrevealed = paragraph.getAttribute('data-unrevealed');
      if (revealed) paragraph.style.setProperty('--reveal-active', revealed);
      if (unrevealed) paragraph.style.setProperty('--reveal-inactive', unrevealed);

      const highlightReveal = paragraph.getAttribute('data-highlight');
      if (highlightReveal) paragraph.style.setProperty('--highlight', highlightReveal);

      // Automatically add highlight class to all <span> tags inside .text-reveal
      const spans = paragraph.querySelectorAll('span');
      spans.forEach(span => {
        span.classList.add('highlight');
        // Always propagate highlight color variables from parent to span
        span.style.setProperty('--highlight', highlightReveal || '#ffd600');
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
      if (el.children.length > 0) el.innerHTML = el.textContent || '';
      const style = window.getComputedStyle(el);
      let lh = parseFloat(style.lineHeight);
      if (isNaN(lh)) lh = parseFloat(style.fontSize) * 1.4;
      const H = el.offsetHeight;
      const lines = Math.max(1, Math.round(H / lh));
      this.revealData.set(el, { lh, lines });
      el.style.setProperty('--line-height', `${lh}px`);
    });
    this.calculateTargets();
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

      // Synchronize highlight spans and their dots with the same reveal progress
      const highlights = paragraph.querySelectorAll<HTMLSpanElement>(".highlight");
      highlights.forEach(span => {
        span.style.setProperty('--active-x', `${activeX}%`);
      });
    });
    requestAnimationFrame(this.renderLoop.bind(this));
  }
}

// Usage example (uncomment to use):
// document.addEventListener('DOMContentLoaded', () => {
//   new TextReveal();
// });
