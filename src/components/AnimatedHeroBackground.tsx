"use client";

import { useEffect, useState, useRef } from "react";

export function AnimatedHeroBackground() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      
      containerRef.current.style.setProperty('--mouse-x', x.toString());
      containerRef.current.style.setProperty('--mouse-y', y.toString());
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!mounted) return null;

  const ParallaxLayer = ({ depth, children, className = "" }: { depth: number, children: React.ReactNode, className?: string }) => (
    <div 
      className={`absolute inset-0 pointer-events-none transition-transform duration-75 ease-out ${className}`} 
      style={{ transform: `translate(calc(var(--mouse-x, 0) * ${depth}px), calc(var(--mouse-y, 0) * ${depth}px))` }}
    >
      {children}
    </div>
  );

  return (
    <div className="hero-background" ref={containerRef}>
      <div className="hero-background__wash" />
      
      {/* Ambient Glows */}
      <ParallaxLayer depth={15}>
        <div className="hero-glow hero-glow--one" />
      </ParallaxLayer>
      <ParallaxLayer depth={10}>
        <div className="hero-glow hero-glow--two" />
      </ParallaxLayer>
      <ParallaxLayer depth={25}>
        <div className="hero-glow hero-glow--three" />
      </ParallaxLayer>

      {/* Orbit Paths */}
      <ParallaxLayer depth={8}>
        <svg className="hero-orbit hero-orbit--one" viewBox="0 0 1200 700" preserveAspectRatio="none">
          <path d="M-80 510 C 220 70, 860 40, 1280 350" />
          <circle cx="0" cy="0" r="5" className="hero-orbit__dot hero-orbit__dot--one" />
        </svg>
      </ParallaxLayer>
      <ParallaxLayer depth={12}>
        <svg className="hero-orbit hero-orbit--two" viewBox="0 0 1200 700" preserveAspectRatio="none">
          <path d="M-100 140 C 280 610, 860 630, 1300 200" />
          <circle cx="0" cy="0" r="4" className="hero-orbit__dot hero-orbit__dot--two" />
        </svg>
      </ParallaxLayer>

      {/* Floating Particles */}
      <ParallaxLayer depth={30}>
        <div className="hero-particle hero-particle--one" />
      </ParallaxLayer>
      <ParallaxLayer depth={40}>
        <div className="hero-particle hero-particle--two" />
      </ParallaxLayer>
      <ParallaxLayer depth={20}>
        <div className="hero-particle hero-particle--three" />
      </ParallaxLayer>
      <ParallaxLayer depth={50}>
        <div className="hero-particle hero-particle--four" />
      </ParallaxLayer>

      {/* SVG Waves at the bottom */}
      <div className="hero-waves">
        <ParallaxLayer depth={5}>
          <svg
            className="hero-wave hero-wave--back"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0 108 C150 188 310 190 470 115 S790 30 960 105 S1110 174 1320 80 L1320 220 L0 220Z" />
          </svg>
        </ParallaxLayer>
        <ParallaxLayer depth={10}>
          <svg
            className="hero-wave hero-wave--middle"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0 150 C170 60 320 62 510 146 S840 240 1010 130 S1160 48 1320 112 L1320 220 L0 220Z" />
          </svg>
        </ParallaxLayer>
        <ParallaxLayer depth={15}>
          <svg
            className="hero-wave hero-wave--front"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0 112 C170 210 330 210 500 116 S820 30 1010 118 S1165 190 1320 86 L1320 220 L0 220Z" />
          </svg>
        </ParallaxLayer>
        <ParallaxLayer depth={20}>
          <div className="hero-wave__line hero-wave__line--one" />
        </ParallaxLayer>
        <ParallaxLayer depth={25}>
          <div className="hero-wave__line hero-wave__line--two" />
        </ParallaxLayer>
      </div>
    </div>
  );
}

