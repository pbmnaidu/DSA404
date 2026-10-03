const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Match dark:classes
    let newContent = content.replace(/dark:[a-zA-Z0-9\-\[\]#\/%:]+/g, '');
    
    // Cleanup double spaces
    newContent = newContent.replace(/ {2,}/g, ' ');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      modifiedCount++;
      console.log(`Updated ${filePath}`);
    }
  }
});

console.log(`Finished. Modified ${modifiedCount} files.`);
