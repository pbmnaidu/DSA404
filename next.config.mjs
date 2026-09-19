import fs from "node:fs";

// Polyfill: Fix Windows directories containing '#' (e.g. C:\#Projects)
// Webpack enhanced-resolve escapes '#' as '\0#' which triggers Node.js ERR_INVALID_ARG_VALUE
const cleanPath = (p) => {
  if (typeof p === "string" && p.includes("\0#")) {
    return p.replace(/\0#/g, "#");
  }
  return p;
};

const origReadFile = fs.readFile;
fs.readFile = function (path, ...args) {
  return origReadFile.call(this, cleanPath(path), ...args);
};
const origReadFileSync = fs.readFileSync;
fs.readFileSync = function (path, ...args) {
  return origReadFileSync.call(this, cleanPath(path), ...args);
};
const origStat = fs.stat;
fs.stat = function (path, ...args) {
  return origStat.call(this, cleanPath(path), ...args);
};
const origStatSync = fs.statSync;
fs.statSync = function (path, ...args) {
  return origStatSync.call(this, cleanPath(path), ...args);
};
const origOpen = fs.open;
fs.open = function (path, ...args) {
  return origOpen.call(this, cleanPath(path), ...args);
};
const origOpenSync = fs.openSync;
fs.openSync = function (path, ...args) {
  return origOpenSync.call(this, cleanPath(path), ...args);
};

if (fs.promises) {
  const origPReadFile = fs.promises.readFile;
  fs.promises.readFile = function (path, ...args) {
    return origPReadFile.call(this, cleanPath(path), ...args);
  };
  const origPOpen = fs.promises.open;
  fs.promises.open = function (path, ...args) {
    return origPOpen.call(this, cleanPath(path), ...args);
  };
  const origPStat = fs.promises.stat;
  fs.promises.stat = function (path, ...args) {
    return origPStat.call(this, cleanPath(path), ...args);
  };
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;

