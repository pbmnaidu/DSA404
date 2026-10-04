const fs = require('fs');
const path = 'p:/DSA404-chatBot/app/globals.css';
let content = fs.readFileSync(path, 'utf8');

const newCSS = `

/* ═══════════════════════════════════════════════════════════════════
   ANIMATED HERO BACKGROUND
   ═══════════════════════════════════════════════════════════════════ */

@keyframes hero-wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes hero-glow-float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(5%, 5%) scale(1.05); }
  66% { transform: translate(-5%, 8%) scale(0.95); }
}

@keyframes hero-glow-float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-8%, -5%) scale(0.95); }
  66% { transform: translate(5%, -8%) scale(1.05); }
}

@keyframes hero-glow-float-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(0, 10%) scale(1.1); }
}

@keyframes hero-float-1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(0, -20px); }
}

@keyframes hero-float-2 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(10px, -15px); }
}

@keyframes hero-float-3 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-10px, -25px); }
}

.animate-hero-wave-1 { animation: hero-wave 25s linear infinite; }
.animate-hero-wave-2 { animation: hero-wave 35s linear infinite; }
.animate-hero-wave-3 { animation: hero-wave 45s linear infinite; }

.animate-hero-glow-1 { animation: hero-glow-float-1 20s ease-in-out infinite; }
.animate-hero-glow-2 { animation: hero-glow-float-2 25s ease-in-out infinite; }
.animate-hero-glow-3 { animation: hero-glow-float-3 30s ease-in-out infinite; }

.animate-hero-spin-slow { animation: spin 60s linear infinite; }
.animate-hero-spin-reverse { animation: spin 45s linear infinite reverse; }

.animate-hero-float-1 { animation: hero-float-1 8s ease-in-out infinite; }
.animate-hero-float-2 { animation: hero-float-2 10s ease-in-out infinite; }
.animate-hero-float-3 { animation: hero-float-3 12s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .animate-hero-wave-1,
  .animate-hero-wave-2,
  .animate-hero-wave-3,
  .animate-hero-glow-1,
  .animate-hero-glow-2,
  .animate-hero-glow-3,
  .animate-hero-spin-slow,
  .animate-hero-spin-reverse,
  .animate-hero-float-1,
  .animate-hero-float-2,
  .animate-hero-float-3 {
    animation: none !important;
  }
}
`;

if (!content.includes('ANIMATED HERO BACKGROUND')) {
  fs.writeFileSync(path, content + newCSS);
  console.log('CSS appended');
} else {
  console.log('CSS already exists');
}
