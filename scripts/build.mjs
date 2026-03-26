import * as esbuild from "esbuild";
import { cpSync, copyFileSync, rmSync, mkdirSync } from "fs";

const isWatch = process.argv.includes("--watch");

// Clean and prepare dist/
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

// Copy static files
copyFileSync("manifest.json", "dist/manifest.json");
copyFileSync("src/options/options.html", "dist/options.html");
copyFileSync("src/options/options.css", "dist/options.css");
cpSync("icons", "dist/icons", { recursive: true });
cpSync("_locales", "dist/_locales", { recursive: true });

const commonOptions = {
  bundle: true,
  format: "iife",
  target: "chrome120",
};

const entries = [
  { entryPoints: ["src/content.ts"], outfile: "dist/content.js" },
  {
    entryPoints: ["src/options/index.tsx"],
    outfile: "dist/options.js",
    jsx: "automatic",
    jsxImportSource: "preact",
  },
  { entryPoints: ["src/background.ts"], outfile: "dist/background.js" },
];

if (isWatch) {
  const contexts = await Promise.all(
    entries.map((entry) => esbuild.context({ ...commonOptions, ...entry })),
  );
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("Watching for changes...");
} else {
  await Promise.all(
    entries.map((entry) => esbuild.build({ ...commonOptions, ...entry })),
  );
  console.log("Build complete");
}
