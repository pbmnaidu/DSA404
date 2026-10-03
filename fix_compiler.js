const fs = require('fs');
const path = require('path');

const filePaths = [
  path.join('p:', 'DSA404-chatBot', 'src', 'components', 'CodeEditor.tsx'),
  path.join('p:', 'DSA404-chatBot', 'src', 'components', 'CodeChefCompilerModal.tsx')
];

for (const filePath of filePaths) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Force the CodeEditor wrapper to ALWAYS use dark mode tokens so that it remains a dark editor
    // OR we can just let it adapt to the global theme. 
    // Since THEMES[0].bg is bg-[#0c1017], it expects to be a dark editor.
    // If it expects to be a dark editor, we should just inject the "dark" class.
    
    // In CodeEditor.tsx
    if (filePath.includes('CodeEditor.tsx')) {
      content = content.replace(
        /"flex flex-col rounded-lg border transition-all duration-150 overflow-hidden shadow-sm",/g,
        '"flex flex-col rounded-lg border transition-all duration-150 overflow-hidden shadow-sm dark",'
      );
      // Fix the text-muted in textarea to be text-foreground so code is highly visible
      content = content.replace(/bg-transparent text-muted outline-none/g, 'bg-transparent text-foreground outline-none');
      // Fix gutter to use text-muted-foreground instead of text-muted
      content = content.replace(/bg-black text-muted shrink-0/g, 'bg-background text-muted-foreground shrink-0');
      content = content.replace(/bg-black/g, 'bg-background');
    }

    // In CodeChefCompilerModal.tsx, we must also ensure modal contents use accessible colors
    if (filePath.includes('CodeChefCompilerModal.tsx')) {
      // Find hardcoded colors that break
      content = content.replace(/bg-\[#111827\]/g, 'bg-background');
      content = content.replace(/bg-\[#1f2937\]/g, 'bg-muted');
      content = content.replace(/bg-\[#0b0f19\]/g, 'bg-background');
      content = content.replace(/bg-black/g, 'bg-background');
      content = content.replace(/text-gray-400/g, 'text-muted-foreground');
      content = content.replace(/text-gray-300/g, 'text-foreground');
      content = content.replace(/text-gray-200/g, 'text-foreground');
      content = content.replace(/border-gray-800/g, 'border-border');
      content = content.replace(/border-gray-700/g, 'border-border');
      
      // Make sure it doesn't force a broken "dark" mode wrapper if it doesn't have the dark class
      // Let's just add 'dark' to the top level of the modal so it looks like a cool dark IDE modal
      content = content.replace(
        /className={cn\(\s*"w-full max-w-6xl h-\[90vh\] flex flex-col p-0 overflow-hidden border-border rounded-xl",/,
        'className={cn(\n          "w-full max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden border-border rounded-xl dark bg-background text-foreground",'
      );
    }

    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Fixed CodeEditor and Compiler Modal visibility');
