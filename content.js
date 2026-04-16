document.addEventListener("DOMContentLoaded", () => {
    const reveals = document.querySelectorAll('.text-reveal');
    const revealData = new Map();
    
    // We use JS to gracefully polyfill the timeline logic so it works flawlessly 
    // across Firefox, Safari, and older versions of Chrome!
    const observer = new ResizeObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;
            
            if (el.children.length > 0) el.innerHTML = el.textContent;
            
            const style = window.getComputedStyle(el);
            let lh = parseFloat(style.lineHeight);
            if (isNaN(lh)) lh = parseFloat(style.fontSize) * 1.4;
            
            const H = el.offsetHeight;
            const lines = Math.max(1, Math.round(H / lh));
            
            revealData.set(el, { lh, lines });
            el.style.setProperty('--line-height', `${lh}px`);
        });
        
        updateScrollProgress();
    });

    const updateScrollProgress = () => {
        const windowHeight = window.innerHeight;
        
        reveals.forEach(paragraph => {
            const data = revealData.get(paragraph);
            if (!data) return;
            
            const rect = paragraph.getBoundingClientRect();
            const totalDistance = windowHeight + rect.height;
            const scrolled = windowHeight - rect.top;
            
            let progress = scrolled / totalDistance;
            
            // Map to a comfortable scroll range (starts at 20% in view, finishes at 80%)
            progress = (progress - 0.2) / 0.6;
            progress = Math.max(0, Math.min(1, progress));
            
            // Apply Easing In/Out (Sine) to make the motion feel more organic
            // It will start revealing slowly, speed up in the middle, and slow down to finish
            const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
            const easedProgress = easeInOutSine(progress);
            
            // We calculate the exact grid masks in JS to ensure absolute cross-browser compatibility
            const scaledProgress = easedProgress * data.lines;
            const currentLine = Math.floor(scaledProgress);
            const fraction = scaledProgress - currentLine;
            
            const fullyActiveY = currentLine * data.lh;
            const activeX = fraction * 100;
            
            paragraph.style.setProperty('--fully-active-y', `${fullyActiveY}px`);
            paragraph.style.setProperty('--active-x', `${activeX}%`);
        });
    };

    reveals.forEach(paragraph => observer.observe(paragraph));
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
});
