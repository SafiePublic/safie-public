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

if (isWatch) {
  const ctx1 = await esbuild.context({
    ...commonOptions,
    entryPoints: ["src/content.ts"],
    outfile: "dist/content.js",
  });
  const ctx2 = await esbuild.context({
    ...commonOptions,
    entryPoints: ["src/options.ts"],
    outfile: "dist/options.js",
  });
  await Promise.all([ctx1.watch(), ctx2.watch()]);
  console.log("Watching for changes...");
} else {
  await esbuild.build({
    ...commonOptions,
    entryPoints: ["src/content.ts"],
    outfile: "dist/content.js",
  });
  await esbuild.build({
    ...commonOptions,
    entryPoints: ["src/options.ts"],
    outfile: "dist/options.js",
  });
  console.log("Build complete");
}
