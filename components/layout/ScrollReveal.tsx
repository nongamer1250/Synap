'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    // Standard Multi-trigger viewport observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target); // Reveal once and stop observing for maximum scroll performance
          }
        });
      },
      {
        threshold: 0.05,        // Trigger when at least 5% of the element is visible
        rootMargin: '0px 0px -40px 0px', // Trigger slightly inside the viewport
      }
    );

    // Look for all custom reveal classes
    const elements = document.querySelectorAll(
      '.reveal-on-scroll, .reveal-left, .reveal-right, .reveal-scale'
    );
    
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pathname]); // Reset and re-observe on page changes (routes)

  return null;
}
