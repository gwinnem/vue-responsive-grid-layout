# Security Policy

## Supported versions

This project publishes a single, continuously-updated major version line
(currently `2.x`, as of the `2.0.0` release — see
[`MIGRATION.md`](./MIGRATION.md) for what changed getting there) — see
[`CHANGELOG.md`](./CHANGELOG.md) for release history. There
is no long-term-support branch for older versions; security fixes are
released as a new patch/minor version on top of the latest release.
Upgrading to the latest published version is the supported way to receive
a security fix.

## Reporting a vulnerability

**Please do not open a public GitHub issue for a security vulnerability.**
A public issue gives anyone using this library in production advance
notice of an exploitable problem before a fix is available.

Instead, report it privately using
[GitHub's private vulnerability reporting](https://github.com/gwinnem/vue-responsive-grid-layout/security/advisories/new)
for this repository ("Security" tab → "Report a vulnerability"). If that's
not available or accessible to you, open a regular issue asking for a
private contact channel without describing the vulnerability itself.

Please include, as applicable:

- The version of `vue-ts-responsive-grid-layout` affected.
- A minimal reproduction — a fork of one of the
  [examples](https://vue-ts-responsive-grid-layout.winnem.tech/examples/01-example)
  is a good starting point (see
  [`CONTRIBUTING.md`](./CONTRIBUTING.md#reporting-bugs--requesting-features)
  for the equivalent guidance on regular bug reports).
- The potential impact as you understand it (e.g. XSS via unsanitized
  layout data, prototype pollution, a ReDoS in a validator).

## What to expect

This is a community-maintained open source project without a dedicated
security team or a service-level agreement on response time. That said:

- You should receive an acknowledgment of your report.
- If the report is confirmed as a real vulnerability, a fix will be
  prioritized over other pending work, and a new version published via
  the automated release pipeline (see
  [`docs/REFACTOR_STRATEGY.md`](./docs/REFACTOR_STRATEGY.md)'s CI/CD
  section) once it's ready.
- Credit will be given in the release notes / `CHANGELOG.md`, unless you
  ask not to be credited.

## Scope

This library runs entirely client-side and doesn't perform network
requests, read from `localStorage`/cookies, or handle authentication —
its attack surface is primarily:

- **The `layout` array and other props/slot content a consumer passes
  in.** If you find a way for attacker-controlled layout data (e.g. a
  malicious `i`, `x`, `y`, `w`, `h`, or a crafted `responsiveLayouts`
  object) to cause something worse than a rendering glitch or a thrown
  error — arbitrary code execution, prototype pollution, a denial-of-service
  via pathological input — that's in scope.
- **Supply chain**: this project's own dependencies
  (`@interactjs/*`, `mitt`) and the `npm audit --omit=dev --audit-level=high`
  gate in CI (see `.github/workflows/ci.yml`) that watches them.

Out of scope: vulnerabilities that require the consumer's own application
to already be compromised, or that only affect the documentation site
(`vitepress-docs/`) or the internal demo/sandbox apps, which aren't
published or run in any consumer's environment.
