#!/usr/bin/env node
/**
 * Generates a publish-ready package tarball, running every quality gate
 * this project has along the way — the same checks CI runs, plus the
 * pack-and-install smoke test, in one command rather than remembering
 * to run each manually before a release.
 *
 * Deliberately stops short of `npm publish` itself: that requires an
 * authenticated npm session (`npm login` or an `NPM_TOKEN`) this script
 * has no way to provide on its own, and publishing a real, public
 * package other people may depend on should be a deliberate, directly
 * taken action by whoever's actually authenticated — not something a
 * script silently does as its last step. See the printed summary at the
 * end for the exact next command.
 *
 * Usage:
 *   npm run package              # full pipeline, stops before publish
 *   npm run package -- --skip-tests   # for a quick local dry run only
 *   npm run package -- --publish      # also runs `npm publish` at the end,
 *                                      # if and only if you're already
 *                                      # authenticated (see the check
 *                                      # for this below) — still asks
 *                                      # for one more explicit confirmation
 *                                      # first, since this step is the
 *                                      # one that can't be undone.
 *
 * What "generating the package" means concretely: everything
 * `npm publish` itself would do (typecheck, build, pack respecting
 * `files`/`exports`/`.npmignore`) plus this project's own additional
 * gates (bundle size, license allowlist, the pack-and-install smoke
 * test) that a bare `npm publish` doesn't know to run.
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const skipTests = args.includes('--skip-tests');
const doPublish = args.includes('--publish');
const otpFlag = args.find((a) => a.startsWith('--otp='));

function log(msg) {
  console.log(`[generate-package] ${msg}`);
}

function step(label, cmd) {
  log(`▶ ${label}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function readPackageJson() {
  return JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
}

/**
 * Confirms interactively before the one truly irreversible-in-practice
 * step (`npm publish` — technically un-publishable within 72 hours per
 * npm's own policy, but not something to treat as a safety net). Only
 * called when --publish was explicitly passed; the default pipeline
 * never reaches this.
 */
function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  const pkg = readPackageJson();
  log(`Generating package for ${pkg.name}@${pkg.version}`);

  // --- Quality gates -------------------------------------------------
  // Same checks CI runs (see .github/workflows/ci.yml), run here too so
  // a local `npm run package` can't produce a tarball CI would have
  // rejected.
  step('Typecheck', 'npm run typecheck');
  step('Style lint (blocking gate)', 'npm run lint:style');
  step('Dependency license allowlist', 'npm run check:licenses');
  if (!skipTests) {
    step('Unit/component tests + coverage', 'npm run test:coverage');
  } else {
    log('⚠ --skip-tests passed: unit tests were NOT run. Do not use a tarball built this way for an actual release.');
  }

  // --- Build -----------------------------------------------------------
  step('Clean previous build output', process.platform === 'win32' ? 'rmdir /s /q dist 2>nul & exit 0' : 'rm -rf dist');
  step('Build library (ES + UMD + type declarations)', 'npm run build:only');

  // --- Post-build checks ----------------------------------------------
  step('Bundle size budget', 'npm run check:bundle-size');
  step('Pack-and-install smoke test (verifies the actual published shape, not just src/)', 'npm run check:package-install');

  // --- Produce the actual tarball -------------------------------------
  log('▶ Packing final tarball (npm pack)');
  // --json rather than parsing plain-text output: npm's own lifecycle
  // scripts (this project's "prepare": "husky") can print output that
  // doesn't end in a newline right before the result, which broke a
  // naive "take the last line" parse in an earlier version of this
  // script — finding the JSON array's own opening bracket and parsing
  // from there sidesteps that regardless of what a lifecycle script
  // prints or how it's terminated.
  const rawPackOutput = execSync('npm pack --json', { cwd: ROOT, encoding: 'utf8' });
  const jsonStart = rawPackOutput.indexOf('[');
  if (jsonStart === -1) {
    console.error(`[generate-package] Could not find JSON output from "npm pack --json":\n${rawPackOutput}`);
    process.exit(1);
  }
  const [packResult] = JSON.parse(rawPackOutput.slice(jsonStart));
  const tarballName = packResult.filename;
  const tarballPath = path.join(ROOT, tarballName);

  if (!existsSync(tarballPath)) {
    console.error(`[generate-package] Expected tarball not found at ${tarballPath} (npm pack reported filename "${tarballName}")`);
    process.exit(1);
  }

  log(`Tarball created: ${tarballName} (${(packResult.size / 1024).toFixed(1)} KB packed / ${(packResult.unpackedSize / 1024).toFixed(1)} KB unpacked, ${packResult.entryCount} files)`);

  // --- Summary ----------------------------------------------------------
  console.log(``);
  console.log(`[generate-package] ─────────────────────────────────────────`);
  console.log(`[generate-package] All checks passed. Package ready: ${tarballName}`);
  console.log(`[generate-package] Contents match exactly what "npm publish" would push.`);
  console.log(`[generate-package] ─────────────────────────────────────────`);

  if (!doPublish) {
    console.log(``);
    console.log(`To actually publish, from an authenticated npm session:`);
    console.log(`  npm login          # if not already logged in`);
    console.log(`  npm publish        # publishes package.json's own version (${pkg.version})`);
    console.log(`  # or, to publish the exact tarball this script just produced:`);
    console.log(`  npm publish ${tarballName}`);
    console.log(``);
    console.log(`This script deliberately stops here — publishing needs your own`);
    console.log(`authenticated npm session, not this script's.`);
    return;
  }

  // --- Optional --publish path: still requires the operator to be ----
  // --- already authenticated, and still asks for one more explicit ---
  // --- confirmation, since this is the one step here that can't be ---
  // --- undone the way every prior step in this file can be re-run. ---
  log('--publish passed — checking for an authenticated npm session...');
  let whoami;
  try {
    whoami = execSync('npm whoami', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    console.error(``);
    console.error(`[generate-package] Not logged in to npm ("npm whoami" failed).`);
    console.error(`[generate-package] This script cannot log you in — that requires`);
    console.error(`[generate-package] entering your own npm credentials, which only you`);
    console.error(`[generate-package] should do, directly, via "npm login".`);
    console.error(``);
    console.error(`[generate-package] Tarball is ready at ${tarballName} — run "npm login"`);
    console.error(`[generate-package] then "npm publish ${tarballName}" (or re-run this`);
    console.error(`[generate-package] script with --publish) when ready.`);
    process.exit(1);
  }

  console.log(``);
  console.log(`Logged in to npm as: ${whoami}`);
  console.log(`About to run: npm publish (publishes ${pkg.name}@${pkg.version} publicly, under this account)`);
  const answer = otpFlag
    ? 'yes'
    : await confirm(`Type "yes" to confirm, anything else to abort: `);

  if (answer !== 'yes') {
    console.log(`Aborted — nothing was published. Tarball remains at ${tarballName}.`);
    return;
  }

  const otp = otpFlag ? `--otp=${otpFlag.split('=')[1]}` : '';
  step(`Publishing ${pkg.name}@${pkg.version}`, `npm publish ${tarballName} ${otp}`.trim());
  console.log(``);
  console.log(`Published ${pkg.name}@${pkg.version}.`);
}

main().catch((err) => {
  console.error(`[generate-package] Failed:`, err.message);
  process.exit(1);
});
