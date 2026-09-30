# @operately/turboui

Operately's React components and complete product pages. Components accept data
and callbacks; your application owns fetching, mutations, and navigation.

## Install

```sh
npm install @operately/turboui react@^18.3 react-dom@^18.3 react-router@^7.6.3 i18next@^22.5.1 react-i18next@^12.2
```

The package provides ES modules and TypeScript declarations for modern browser
bundlers. React 18 is supported; CommonJS and server rendering are not supported
contracts. Use Node 20 or newer for development (React Router requires it).

```tsx
import { PrimaryButton, ToasterBar } from "@operately/turboui";
import "@operately/turboui/styles.css";
import { MemoryRouter } from "react-router";

export function Demo() {
  return (
    <MemoryRouter>
      <ToasterBar />
      <PrimaryButton onClick={() => alert("Hello")}>Try it</PrimaryButton>
    </MemoryRouter>
  );
}
```

## Styles, themes, and fonts

Import `styles.css` once. It includes compiled Tailwind 3 utilities, Preflight,
light/dark theme variables, editor and date-picker styles. Consumers do not need
Tailwind or access to TurboUI source files. Put `class="light"` or `class="dark"`
on the document's `<html>` element so body-level portals inherit the theme.

This stylesheet includes **global resets and body styles**. Use an isolated demo
document (such as an iframe) or a compatible host styling setup. It does not
isolate itself from another Tailwind version. The app expects Inter with a
sans-serif fallback; load Inter yourself, for example through `@fontsource/inter`.
No fonts or remote font requests are bundled.

## Runtime setup

- **Routing:** links and some page components require React Router. Use
  `MemoryRouter` for isolated demos or your application's router for real routes.
- **Translations:** `i18n` initializes English fallback strings when no instance
  has been initialized. Existing initialization is preserved. Applications with
  translation catalogs can initialize the shared i18next peer themselves using
  the exported `i18nOptions` from `@operately/turboui`. The shared `i18n`
  instance is also available from that root import.
- **Dates and numbers:** pass locale/timezone preferences through each component's
  declared props. `defaultFormattedTimePreferences` is available from the root
  export; real applications should supply their user's preferences.
- **Rich text:** provide the declared handlers for mentions, uploads, resource
  links, and task interactions. Demo callbacks should update local state.
- **Notifications:** render one `ToasterBar` where components use toast feedback.

All JavaScript and types come from `@operately/turboui`, including page types
such as `SpaceKpisPageTypes`. Only the stylesheet uses a separate import path.
`ApiTypes` and internal source paths are not public entry points.

The Operately app keeps its existing `"turboui": "file:../turboui"` dependency
and source alias, so its code continues to import from `"turboui"`. Other
consumers can also keep that name by installing an npm alias:

```sh
npm install turboui@npm:@operately/turboui@0.1.0
```

With that alias, use `import { PrimaryButton } from "turboui"` and
`import "turboui/styles.css"`.

Pages can affect document titles, scrolling, and keyboard handling; packaging does
not change these existing behaviors.

## Astro

With Astro's React integration enabled, keep state and callbacks inside a React
wrapper and render it only in the browser:

```astro
---
import { Demo } from "../components/Demo";
---
<Demo client:only="react">
  <p slot="fallback">Loading demo…</p>
</Demo>
```

The surrounding Astro/MDX content can still be prerendered. `client:only` does
not provide CSS isolation; an embedded demo document can load the standalone
stylesheet separately from the marketing site's styles.

## Build and validate

From this directory:

```sh
npm ci
npm run build
npm run dev                 # Watch JavaScript, declarations, and styles
npm run test:package        # Isolated build, pack, artifact, and consumer checks
npm pack                   # Builds before creating the publishable tarball
```

With the development container running, use these commands from the repository root:

```sh
make turboui.test.package
make turboui.pack
```

`make turboui.pack` ensures dependencies are installed and creates the `.tgz`
file in `turboui/`. It does not publish to npm.

Package checks build TurboUI outside the repository, create a tarball, and
validate its extracted contents. They also install the tarball in an isolated
consumer, type-check and bundle its public imports, and verify rendering, styles,
and interaction in Chromium. They require `tar` and Chromium's system
dependencies. The Docker/CI command uses the container's system Chromium.
For direct npm runs, set `CHROMIUM_EXECUTABLE_PATH` to use an installed browser;
otherwise, the check downloads Playwright's Chromium automatically. Set
`TURBOUI_PACKAGE_CHECK_DIR` to an empty directory to retain the isolated source,
tarball, extracted package, and consumer for inspection.

`npm pack` includes compiled output, this README, and the Apache-2.0 license.
It excludes tests, fixtures, Storybook, and build tools. Installing the tarball
does not compile anything. Version 0.1.0 is prepared for public npm publishing;
publishing and release automation are separate steps.
