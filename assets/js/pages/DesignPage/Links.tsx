import * as React from "react";

import { BlackLink, DimmedLink, Link } from "@/components/Link";
import { Section, SectionTitle } from "./Section";

export function Links() {
  return (
    <Section>
      <SectionTitle>Links</SectionTitle>

      <div className="max-w-2xl mt-2 mb-10">
        Wherever possible use blue links with underline. This is the standard for links on the web, and is the most
        recognizable and accessible for users. Links should be used to navigate to a new page or to a new section of the
        current page, and should never be used to trigger an action. Use non-standard links sparingly, and only when the
        standard blue link is not appropriate.
      </div>

      <div className="grid grid-cols-4 font-bold">
        <div>Normal with Underline</div>
        <div>Bold with Underline</div>
        <div>Underline on Hover</div>
        <div>No Underline</div>
      </div>

      <div className="grid grid-cols-4 mt-2 font-medium">
        <Link to="/" className="font-medium">
          Example
        </Link>
        <Link to="/" className="font-bold">
          Example
        </Link>
        <Link to="/" underline="hover">
          Example
        </Link>
        <Link to="/" underline="never">
          Example
        </Link>
      </div>

      <div className="grid grid-cols-4 mt-2">
        <BlackLink to="/" className="font-medium">
          Example
        </BlackLink>
        <BlackLink to="/" className="font-bold">
          Example
        </BlackLink>
        <BlackLink to="/" underline="hover">
          Example
        </BlackLink>
        <BlackLink to="/" underline="never">
          Example{" "}
        </BlackLink>
      </div>

      <div className="grid grid-cols-4 mt-2">
        <DimmedLink to="/" className="font-medium">
          Example
        </DimmedLink>
        <DimmedLink to="/" className="font-bold">
          Example
        </DimmedLink>
        <DimmedLink to="/" underline="hover">
          Example
        </DimmedLink>
        <DimmedLink to="/" underline="never">
          Example
        </DimmedLink>
      </div>
    </Section>
  );
}
