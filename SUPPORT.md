# Support

This describes what kind of support this project provides, and how to
get help. For security vulnerabilities specifically, see
[`SECURITY.md`](./SECURITY.md) instead — don't open a public issue for
those.

## What this is

`vue-ts-responsive-grid-layout` is a community-maintained open source
project. There is no commercial support contract, no service-level
agreement, and no dedicated support team — see "Maintenance model"
below for what that means in practice.

## Supported versions

One continuously-updated major version line is supported at a time —
currently `2.x`. There is no long-term-support (LTS) branch for older
major versions; a security or critical bug fix is released as a new
version on top of the latest release, not backported. See
[`MIGRATION.md`](./MIGRATION.md) if you're upgrading across a major
version boundary, and [`CHANGELOG.md`](./CHANGELOG.md) for the full
release history.

## Supported environments

- **Vue**: `^3.0.0` (peer dependency) — Vue 2 is not supported; see
  [`COMPARISON_ALTERNATIVES.md`](./COMPARISON_ALTERNATIVES.md) for
  Vue-2-specific alternatives if that's a hard requirement.
- **Node.js**: `^18.0.0 || ^20.0.0 || >=22.0.0` (for building/developing
  this project itself — consumers using the published package in a
  browser aren't bound by this).
- **Browsers**: relies on `ResizeObserver` and standard modern CSS,
  broadly supported across current browser versions. No minimum
  browser version has been independently verified against real old
  browser builds — see
  [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) for that
  caveat stated plainly, rather than an unverified claim here.

## How to get help

- **Bug reports and feature requests**: open a
  [GitHub issue](https://github.com/gwinnem/vue-responsive-grid-layout/issues) —
  see [`CONTRIBUTING.md`](./CONTRIBUTING.md#reporting-bugs--requesting-features)
  for what makes a report actionable (a minimal reproduction, ideally
  forked from one of the
  [documentation examples](https://vue-ts-responsive-grid-layout.winnem.tech)).
- **Usage questions** ("how do I...", "why doesn't X work in my app"):
  also GitHub issues, for now — there's no separate discussion forum
  or chat channel.
- **Security vulnerabilities**: see [`SECURITY.md`](./SECURITY.md) —
  use private reporting, not a public issue.

## What to expect

No response-time guarantee. In practice:

- Issues are triaged as the maintainer has time; there's no fixed SLA.
- A confirmed, reproducible bug is generally prioritized over feature
  requests.
- Pull requests that follow [`CONTRIBUTING.md`](./CONTRIBUTING.md)'s
  guidance (tests included, CI passing) are easier to review quickly
  than ones that don't.

## Maintenance model — stated plainly

This project currently has a single maintainer (see
[`CODEOWNERS`](./.github/CODEOWNERS)). That's a real bus-factor
consideration worth knowing about if you're evaluating this library
for a context where vendor continuity matters — there is no
organization or team backing this beyond one person's own time. This
isn't a promise that will always be true, just an accurate statement
of where things stand today rather than an implied guarantee of
continuity this project can't actually make.

## Commercial support

None currently offered. If your organization needs a support contract,
guaranteed response times, or indemnification, this project in its
current form isn't able to provide that — factor that into your own
risk assessment accordingly.
