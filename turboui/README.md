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
npm install turboui@npm:@operately/turboui@0.3.0
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
does not compile anything. The package is configured for public npm publishing;
publishing and release automation are separate steps.

## Embedding in an open Shadow DOM

`EmbeddingProvider` is opt-in. Supply a positioned portal layer inside the same
shadow root as the UI, and the element that scrolls the preview:

```tsx
import { EmbeddingProvider } from "@operately/turboui";

<EmbeddingProvider
  portalContainer={portalElement}
  scrollContainer={scrollElement}
  manageDocumentTitle={false}
>
  <Demo />
</EmbeddingProvider>
```

The provider keeps supported overlays inside the preview, scopes nested dialog
scroll locks and keyboard focus, and uses the portal layer's unscaled width for
JavaScript breakpoints. `manageDocumentTitle` defaults to true; false preserves
the host article's title. Keep the container elements stable when resizing.
Without a provider, components keep their existing app behavior. If `ResizeObserver`
is unavailable, breakpoint tracking falls back to window resize events.

The host owns the shadow root, React mounting, router, translation setup, and
formatting preferences. It must load TurboUI CSS inside the root and Inter in the
host document. For a simulated viewport, adapt `html`/`body`/`:root` rules to the
demo root, width media queries to container queries, and viewport units to the
demo's dimensions. The standard published CSS is unchanged.

Give the portal layer the preview's full width/height and a containing block for
fixed overlays (for example, a positioned ancestor with `transform: translateZ(0)`).
If it covers the content, set `pointer-events: none` on the layer and `auto` on its
children. The form person picker also needs an Emotion `CacheProvider` whose cache
uses the shadow root as its `container`, so generated styles stay inside it.

See Storybook **Utilities / Embedding** for normal, scaled, offset-portal, and
independent shadow roots. Support currently targets the KPI UI and its editor/pickers;
it does not promise that every TurboUI surface supports embedding. The **Table Menus**
stories cover right-click and keyboard menus in a shadow root, a scaled preview,
a dialog, and a normal document. The Jest tests live beside the component in
`src/RichEditor/components/TableControls.browser.test.ts`. They use the existing
Storybook runner’s Playwright environment, separately from jsdom unit tests:

```sh
./devenv bash -c 'cd turboui && CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser npm run test:browser -- --url http://127.0.0.1:$PORT_STORYBOOK_SERVER --maxWorkers=1'
```

Start Storybook with `make turboui.storybook` before running this focused check.
`make turboui.test.storybook` runs these browser tests after the story checks in CI.

## Demos

`src/demos/` contains shared mock data and in-memory behavior for interactive
Storybook examples and website previews. Demo helpers are exported from
`@operately/turboui` and provide data and callbacks to the regular UI components.

Each demo instance has independent state, makes no backend requests, and resets
when remounted. The host supplies routing, translations, formatting, and the
embedding container. Keep demo state above routes and panels so navigation does
not discard changes.

See [the KPI stories](src/SpaceKpisPage/index.stories.tsx) for an example.
