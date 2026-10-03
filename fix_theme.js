const fs = require('fs');
const path = require('path');

const contextPath = path.join('p:', 'DSA404-chatBot', 'app', 'theme-customizer-context.tsx');
let contextContent = fs.readFileSync(contextPath, 'utf8');

// 1. Replace the "default" preset to be Pearl & Royal
contextContent = contextContent.replace(
  /"default": \{\s*label: "Slate & Sapphire \(Default\)",\s*group: "Monochrome",\s*colors: \{\s*light: \{[^\}]+\},\s*dark: \{[^\}]+\}\s*\}\s*\}/,
  `"default": {
    label: "Pearl & Royal (Default)",
    group: "Premium Light",
    colors: {
      light: { background: "#fdfdfc", foreground: "#172033", primary: "#1d4ed8", card: "#ffffff", muted: "#f3f4f6", border: "#e5e7eb" },
      dark: { background: "#101623", foreground: "#fdfdfc", primary: "#3b82f6", card: "#161e2e", muted: "#1f2937", border: "#374151" }
    }
  }`
);

// Also replace references to return PRESETS["default"].colors -> PRESETS["pearl-royal"].colors just in case
contextContent = contextContent.replace(/PRESETS\["default"\]\.colors/g, 'PRESETS["pearl-royal"].colors');
contextContent = contextContent.replace(/return "default";/g, 'return "pearl-royal";');

fs.writeFileSync(contextPath, contextContent, 'utf8');

const layoutPath = path.join('p:', 'DSA404-chatBot', 'app', 'layout.tsx');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// 2. Fix the antiFoucScript to support dark mode IF explicitly saved, otherwise light.
layoutContent = layoutContent.replace(
  /var doc = document\.documentElement;\s*doc\.classList\.add\('disable-transitions'\);\s*\/\/\s*Lock to Premium Light theme permanently\s*doc\.classList\.add\('light'\);\s*doc\.classList\.remove\('dark'\);\s*doc\.style\.colorScheme = 'light';\s*\/\/\s*Clear legacy theme preferences to prevent mismatch\s*localStorage\.removeItem\('dsa-tracker-theme-custom'\);\s*localStorage\.removeItem\('dsa-theme-mode'\);/,
  `var doc = document.documentElement;
    doc.classList.add('disable-transitions');
    
    // Support dark mode if explicitly set, else Pearl & Royal (light)
    var savedMode = localStorage.getItem('dsa-theme-mode');
    var isDark = savedMode === 'dark';
    if (isDark) {
      doc.classList.add('dark');
      doc.classList.remove('light');
      doc.style.colorScheme = 'dark';
    } else {
      doc.classList.add('light');
      doc.classList.remove('dark');
      doc.style.colorScheme = 'light';
    }`
);

fs.writeFileSync(layoutPath, layoutContent, 'utf8');
console.log('Fixed default themes in context and layout.');
