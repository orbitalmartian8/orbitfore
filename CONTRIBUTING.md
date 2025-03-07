# Contributing to Enafore

## Building

Enafore requires [Node.js](https://nodejs.org/en/) and [pnpm](https://pnpm.io).

To build Enafore for production, first install dependencies:

    pnpm install --frozen-lockfile

Then build:

    pnpm build

Then run:

    PORT=4002 node server.js

### Single-Instance Mode

To build Enafore as a frontend for one instance, set the SINGLE_INSTANCE environment variable.

    SINGLE_INSTANCE=your.domain.tld pnpm build

### Exporting

Enafore is a static site. When you run `pnpm build`, static files will be
written to `__sapper__/export`.

## Installing

To install with dev dependencies, run:

    pnpm install

## Dev server

To run a dev server with hot reloading:

    pnpm dev

Now it's running at `localhost:4002`.

## Linting

Enafore uses [JavaScript Standard Style](https://standardjs.com/).

Lint:

    pnpm lint

Automatically fix most linting issues:

    pnpm lint-fix

## Tests

lol, lmao

## Debug build

To disable minification in a production build (for debugging purposes), you can run:

    DEBUG=1 pnpm build

## Debugging Webpack

The Webpack Bundle Analyzer `report.html` and `stats.json` are available publicly via e.g.:

- https://enafore.social/client/report.html
- https://enafore.social/client/stats.json

This is also available locally after `pnpm build` at `.sapper/client/report.html`.

## Architecture

See [Architecture.md](https://github.com/enafore/enafore/blob/main/docs/Architecture.md).

## Internationalization

See [Internationalization.md](https://github.com/enafore/enafore/blob/main/docs/Internationalization.md).

