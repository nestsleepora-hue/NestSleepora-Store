'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function ScrollReveal({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -60px 0px'
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ 
        transitionDuration: '950ms',
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden'
      }}
      className={`transition-all transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 [transform:rotateX(0deg)]'
          : 'opacity-0 translate-y-8 scale-[0.98] [transform:rotateX(4deg)]'
      }`}
    >
      {children}
    </div>
  );
}
