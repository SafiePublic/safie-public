import * as esbuild from "esbuild";
import { cpSync, copyFileSync, rmSync, mkdirSync } from "fs";

const isWatch = process.argv.includes("--watch");

// Clean and prepare dist/
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

// Copy static files
copyFileSync("manifest.json", "dist/manifest.json");
copyFileSync("options.html", "dist/options.html");
cpSync("icons", "dist/icons", { recursive: true });

const commonOptions = {
  bundle: true,
  format: "iife",
  target: "chrome120",
};

const entries = [
  { entryPoints: ["src/content.ts"], outfile: "dist/content.js" },
  { entryPoints: ["src/options.ts"], outfile: "dist/options.js" },
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
