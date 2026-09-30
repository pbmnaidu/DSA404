import fs from "node:fs";

// Polyfill for Turbopack Windows directory containing '#' character (e.g. C:\#Projects)
// Turbopack passes paths containing \0# which causes Node.js ERR_INVALID_ARG_VALUE

const nodeIndexPath = "node_modules/@tailwindcss/node/dist/index.js";
if (fs.existsSync(nodeIndexPath)) {
  let content = fs.readFileSync(nodeIndexPath, "utf8");
  if (!content.includes(".replace(/\\0/g")) {
    content = content.replace(
      'let l=await ze.default.readFile(i,"utf-8")',
      'if(typeof i==="string")i=i.replace(/\\0/g,"");let l=await ze.default.readFile(i,"utf-8")'
    );
    content = content.replace(
      'let o=await ue.default.readFile(l,"utf-8")',
      'if(typeof l==="string")l=l.replace(/\\0/g,"");let o=await ue.default.readFile(l,"utf-8")'
    );
    fs.writeFileSync(nodeIndexPath, content, "utf8");
    console.log("Patched @tailwindcss/node for Windows null-byte path handling.");
  }
}

const postcssIndexPath = "node_modules/@tailwindcss/postcss/dist/index.js";
if (fs.existsSync(postcssIndexPath)) {
  let content = fs.readFileSync(postcssIndexPath, "utf8");
  if (!content.includes(".replace(/\\0/g")) {
    content = content.replace(
      "Xe.default.statSync(y,",
      'Xe.default.statSync(typeof y==="string"?y.replace(/\\0/g,""):y,'
    );
    fs.writeFileSync(postcssIndexPath, content, "utf8");
    console.log("Patched @tailwindcss/postcss for Windows null-byte path handling.");
  }
}
