export class ScrollToTopBtn {
    private btn: HTMLButtonElement;

    constructor() {
        this.btn = document.createElement('button');
        this.btn.className = 'scroll-to-top-btn';
        this.btn.textContent = 'Scroll to Top';
        document.body.appendChild(this.btn);
        this.btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                this.btn.style.display = 'block';
            } else {
                this.btn.style.display = 'none';
            }
        });
        this.btn.style.display = 'none';
    }
}
