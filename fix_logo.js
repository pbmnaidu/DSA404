const fs = require('fs');
let file = fs.readFileSync('src/components/ThemedLogo.tsx', 'utf8');

const oldLogic = `      const tempEl = document.createElement("div");
      tempEl.style.color = \`oklch(from oklch(\${primaryToken}) l c h)\`; 
      // If the token already has oklch(), we just apply it. Otherwise we format it.
      if (primaryToken.startsWith("oklch(")) {
        tempEl.style.color = primaryToken;
      } else {
        tempEl.style.color = \`oklch(\${primaryToken})\`;
      }
      tempEl.style.display = "none";`;

const newLogic = `      const tempEl = document.createElement("div");
      
      let cssColor = primaryToken;
      // Handle shadcn space-separated HSL values like "210 100% 50%"
      if (/^[\\d.]+\\s+[\\d.]+%?\\s+[\\d.]+%?$/.test(primaryToken)) {
          cssColor = \`hsl(\${primaryToken})\`;
      }
      tempEl.style.color = cssColor;
      tempEl.style.display = "none";`;

if (file.includes('tempEl.style.color = `oklch(from oklch(${primaryToken}) l c h)`;')) {
    file = file.replace(oldLogic, newLogic);
    fs.writeFileSync('src/components/ThemedLogo.tsx', file);
    console.log('Replaced successfully');
} else {
    console.log('Target string not found');
}
