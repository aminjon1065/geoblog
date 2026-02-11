import { useEffect, useRef } from 'react';

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(): React.RefObject<T | null> {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
        );

        const targets = el.querySelectorAll('.fade-in-up');
        for (const target of targets) {
            observer.observe(target);
        }

        // Also observe the element itself if it has the class
        if (el.classList.contains('fade-in-up')) {
            observer.observe(el);
        }

        return () => observer.disconnect();
    }, []);

    return ref;
}
