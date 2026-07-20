#!/usr/bin/env node
/**
 * Pack-and-install smoke test — the one check in this project that
 * verifies the *published* package works, not just `src/`.
 *
 * Every other test here (unit, component, e2e, mutation, visual) imports
 * from source via the `@/` alias — including the demo app, sandbox, and
 * every VitePress example. None of them go through `package.json`'s
 * `exports` field the way an actual `npm install`'d consumer would. That
 * gap is exactly what let a real, published-package-breaking bug ship
 * undetected through 98%+ source coverage: `exports`'s `./style.css`
 * entry pointed at a file that doesn't exist (see docs/REFACTORING.md
 * #46). "Coverage of `src/`" and "the published artifact actually
 * resolves" are different claims, and only the first one was being
 * checked anywhere else in this project.
 *
 * What this does, concretely: `npm pack` the current source, install the
 * resulting tarball into a genuinely separate scratch directory (no
 * shared node_modules, no source aliasing — the only way to actually
 * exercise `exports` rather than quietly bypass it), then confirm every
 * `exports` subpath resolves to a real file and the main entry's expected
 * named exports actually import successfully.
 *
 * Run after `npm run build:only` (like check-bundle-size.js) — this
 * checks the built `dist/` output as packaged, not the raw source.
 */
import { execSync, execFileSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync, readFileSync, copyFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const EXPECTED_NAMED_EXPORTS = [
  'GridLayout',
  'GridItem',
  'CustomCloseButton',
  'CustomDragElement',
  'EGridItemEvent',
  'EGridLayoutEvent',
  'useLayoutStorage',
  'serializeLayout',
  'deserializeLayout',
  'useLayoutPresets',
  'readOutsideDropPayload',
  'exportLayoutAsSvg',
  'DEFAULT_ARIA_LABELS',
  'verticalCompactor',
  'noCompactor',
];

// `./core` — the framework-agnostic entry point (see src/core/index.ts).
// Checked separately, and via `import()` rather than `require()` (this
// one's a plain ESM/CJS dual package with no Vue peer dependency to
// worry about resolving, unlike the main entry's own check below).
const EXPECTED_CORE_NAMED_EXPORTS = [
  'collides',
  'getAllCollisions',
  'getFirstCollision',
  'moveElement',
  'compactLayout',
  'calcXY',
  'clamp',
  'sortLayoutItemsByRowCol',
  'serializeLayout',
  'deserializeLayout',
  'exportLayoutAsSvg',
  'layoutValidator',
  'verticalCompactor',
  'noCompactor',
];

function log(msg) {
  console.log(`[pack-install-smoke] ${msg}`);
}

function fail(msg) {
  console.error(`[pack-install-smoke] FAILED: ${msg}`);
  process.exit(1);
}

if (!existsSync(path.join(ROOT, 'dist'))) {
  fail('Expected build output not found at dist/. Run `npm run build:only` first.');
}

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
let scratchDir;
let tarballName;

try {
  log('Packing tarball...');
  // npm's pack filename is deterministic (name@version, scoped '@'/'/'
  // replaced with '-') — computing it directly is far more robust than
  // parsing `npm pack`'s stdout, which mixes in `npm notice` verbosity
  // and (despite --ignore-scripts not suppressing it in every npm
  // version) the `prepare` script's own output.
  execSync('npm pack --silent --ignore-scripts', { cwd: ROOT, stdio: 'ignore' });
  tarballName = `${pkg.name.replace(/^@/, '').replace(/\//g, '-')}-${pkg.version}.tgz`;
  if (!existsSync(path.join(ROOT, tarballName))) {
    fail(`Expected tarball not found after \`npm pack\`: ${tarballName}`);
  }
  const tarballPath = path.join(ROOT, tarballName);

  scratchDir = mkdtempSync(path.join(tmpdir(), 'pack-install-smoke-'));
  log(`Installing into scratch directory: ${scratchDir}`);

  const scratchTarball = path.join(scratchDir, tarballName);
  copyFileSync(tarballPath, scratchTarball);

  execSync('npm init -y', { cwd: scratchDir, stdio: 'ignore' });
  execSync(`npm install ${JSON.stringify(scratchTarball)} vue@^3`, {
    cwd: scratchDir,
    stdio: 'ignore',
  });

  const installedRoot = path.join(scratchDir, 'node_modules', pkg.name);
  if (!existsSync(installedRoot)) {
    fail(`Package did not install to the expected location: ${installedRoot}`);
  }

  // Resolve every declared exports subpath against the installed package,
  // exactly the way Node's own module resolution would — not by reading
  // package.json and assuming, actually asking Node to resolve it.
  const exportsMap = pkg.exports || {};
  const subpaths = Object.keys(exportsMap);
  log(`Checking ${subpaths.length} exports subpath(s): ${subpaths.join(', ')}`);

  for (const subpath of subpaths) {
    const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.replace(/^\.\//, '')}`;
    try {
      execFileSync('node', ['-e', `console.log(require.resolve(${JSON.stringify(specifier)}))`], {
        cwd: scratchDir,
        encoding: 'utf-8',
      });
      log(`  OK: "${subpath}" -> resolves`);
    } catch (err) {
      fail(`"${subpath}" (specifier "${specifier}") did not resolve.\n${err.stdout || err.message}`);
    }
  }

  // Beyond resolution: confirm the main entry's actual named exports are
  // present after a real import, not just that the file exists.
  log('Checking named exports on the main entry...');
  const checkScript = `
    import(${JSON.stringify(pkg.name)}).then((mod) => {
      const expected = ${JSON.stringify(EXPECTED_NAMED_EXPORTS)};
      const missing = expected.filter((name) => !(name in mod));
      if (missing.length > 0) {
        console.error('Missing named exports: ' + missing.join(', '));
        process.exit(1);
      }
      console.log('All expected named exports present: ' + expected.join(', '));
    }).catch((err) => {
      console.error('Import failed: ' + err.message);
      process.exit(1);
    });
  `;
  execFileSync('node', ['--input-type=module', '-e', checkScript], {
    cwd: scratchDir,
    encoding: 'utf-8',
    stdio: 'inherit',
  });

  // Also confirm ./core's own named exports — and, since this
  // subpath's whole point is having zero Vue dependency, that it can
  // be imported and used without `vue` installed at all having any
  // bearing on it (this scratch install does have `vue` present, from
  // the main entry's own peer dependency above, but ./core's own
  // resolution never touches it either way).
  log('Checking named exports on the ./core entry...');
  const coreSpecifier = `${pkg.name}/core`;
  const coreCheckScript = `
    import(${JSON.stringify(coreSpecifier)}).then((mod) => {
      const expected = ${JSON.stringify(EXPECTED_CORE_NAMED_EXPORTS)};
      const missing = expected.filter((name) => !(name in mod));
      if (missing.length > 0) {
        console.error('Missing named exports on ./core: ' + missing.join(', '));
        process.exit(1);
      }
      console.log('All expected ./core named exports present: ' + expected.join(', '));
    }).catch((err) => {
      console.error('./core import failed: ' + err.message);
      process.exit(1);
    });
  `;
  execFileSync('node', ['--input-type=module', '-e', coreCheckScript], {
    cwd: scratchDir,
    encoding: 'utf-8',
    stdio: 'inherit',
  });

  log('All checks passed — the published package resolves and imports correctly.');
} catch (err) {
  fail(err.message || String(err));
} finally {
  if (tarballName && existsSync(path.join(ROOT, tarballName))) {
    rmSync(path.join(ROOT, tarballName));
  }
  if (scratchDir && existsSync(scratchDir)) {
    rmSync(scratchDir, { recursive: true, force: true });
  }
}
