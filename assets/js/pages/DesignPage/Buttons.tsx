import * as React from "react";

import { Section, SectionTitle } from "./Section";

export function Buttons() {
  return (
    <Section>
      <SectionTitle>Buttons</SectionTitle>

      <div className="max-w-2xl mb-8">
        <p className="mt-2">
          Operately uses rounded primary and secondary buttons. The primary button is used for the main action on a
          page, while the secondary button is used for secondary actions or as a subtle call to action. UI copy is
          written like a sentence, not capitalized.
        </p>
      </div>

      <h3 className="font-bold mb-4">Primary buttons</h3>

      <div className="flex items-center space-x-4">
        <a
          className="rounded-full bg-accent-1 px-2.5 py-1 text-xs font-semibold text-slate-50 shadow-sm hover:bg-accent-1-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-accent-1"
          href=""
        >
          Button text
        </a>
        <a
          className="rounded-full bg-accent-1 px-2.5 py-1 text-sm font-semibold text-slate-50 shadow-sm hover:bg-accent-1-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-accent-1"
          href=""
        >
          Button text
        </a>
        <a
          className="rounded-full bg-accent-1 px-3 py-1.5 text-sm font-semibold text-slate-50 shadow-sm hover:bg-accent-1-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-accent-1"
          href=""
        >
          Button text
        </a>
        <a
          className="rounded-full bg-accent-1 px-3.5 py-2 text-sm font-semibold text-slate-50 shadow-sm hover:bg-accent-1-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-accent-1"
          href=""
        >
          Button text
        </a>
        <a
          className="rounded-full bg-accent-1 px-4 py-2.5 text-sm font-semibold text-slate-50 shadow-sm hover:bg-accent-1-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bg-accent-1"
          href=""
        >
          Button text
        </a>
      </div>

      <h3 className="font-bold mt-8 mb-4">Secondary buttons</h3>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Button text
        </button>
        <button
          type="button"
          className="rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Button text
        </button>
        <button
          type="button"
          className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Button text
        </button>
        <button
          type="button"
          className="rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Button text
        </button>
        <button
          type="button"
          className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Button text
        </button>
      </div>
    </Section>
  );
}
