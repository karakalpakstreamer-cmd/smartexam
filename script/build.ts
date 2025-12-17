import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "axios",
  "cors",
  "date-fns",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "zod",
  "zod-validation-error",
];

// Packages that use createRequire or have issues when bundled
// These must be externalized to avoid runtime errors
const forceExternal = [
  "@google/generative-ai",
  "pg",
  "connect-pg-simple",
  "drizzle-orm",
  "drizzle-zod",
  "openai",
  "ws",
  "xlsx",
  "bcryptjs",
  "pdf-parse",
  "mammoth",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...forceExternal,
  ];
  // Remove duplicates
  const uniqueExternals = [...new Set(externals)];

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    banner: {
      js: `
        var __bundle_path__ = require('path');
        var __bundle_module__ = require('module');
        var __bundled_filename__ = typeof __filename !== 'undefined' ? __filename : '/app/dist/index.cjs';
        var __bundled_dirname__ = typeof __dirname !== 'undefined' ? __dirname : __bundle_path__.dirname(__bundled_filename__);
        var __bundled_require__ = __bundle_module__.createRequire ? __bundle_module__.createRequire(__bundled_filename__) : require;
      `,
    },
    minify: true,
    external: uniqueExternals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
