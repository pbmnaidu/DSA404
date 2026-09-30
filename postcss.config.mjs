import fs from "node:fs";

// Fix Windows paths when directory contains '#' (e.g. C:\#Projects)
// Turbopack / Webpack internal resolvers escape '#' as '\0#' which throws ERR_INVALID_ARG_VALUE in Node fs
const cleanPath = (p) => {
  if (typeof p === "string" && p.includes("\0")) {
    return p.replace(/\0/g, "");
  }
  return p;
};

const methods = [
  "readFile",
  "readFileSync",
  "stat",
  "statSync",
  "open",
  "openSync",
  "lstat",
  "lstatSync",
  "access",
  "accessSync",
];

for (const fn of methods) {
  if (typeof fs[fn] === "function") {
    const orig = fs[fn];
    fs[fn] = function (path, ...args) {
      return orig.call(this, cleanPath(path), ...args);
    };
  }
  if (fs.promises && typeof fs.promises[fn] === "function") {
    const origP = fs.promises[fn];
    fs.promises[fn] = function (path, ...args) {
      return origP.call(this, cleanPath(path), ...args);
    };
  }
}

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;

