import * as React from "react";
import * as Icons from "@tabler/icons-react";
import { Section, SectionTitle } from "./Section";

export function Colors() {
  return (
    <Section>
      <SectionTitle>Colors</SectionTitle>

      <div className="max-w-2xl mt-2 mb-10">
        Operately uses semantic color names to define the color palette, which means that the color names are based on
        their usage rather than their appearance. You should always use these colors in the application so we can
        maintain a consistent look and feel, and easily make changes in the future.
      </div>

      <h3 className="font-bold mt-4 text-lg">Surface Colors</h3>
      <p className="text-sm mb-6">Colors used for the background, surface, and UI elements</p>

      <div className="grid grid-cols-2 gap-8">
        <ColorBox color="bg-base" usage="Background color of the application" />
        <ColorBox color="bg-surface" usage="Color of the UI surface" />
        <ColorBox color="bg-surface-dimmed" usage="Dimmed version of the UI surface, used for page footers" />
        <ColorBox color="bg-surface-accent" usage="Accent color of the UI surface, used for subtle highlights" />
        <ColorBox color="bg-surface-outline" usage="Outline color of the UI surface, used for borders" />
        <ColorBox color="bg-surface-highlight" usage="Highlight color of the UI surface, used for hover effects" />
      </div>

      <h3 className="font-bold mt-10 text-lg">Miscellaneous Colors</h3>
      <p className="text-sm mb-6">CTA buttons, dividers, and other miscellaneous colors</p>

      <div className="grid grid-cols-2 gap-8">
        <ColorBox color="bg-accent-1" usage="Color that stands out, used for primary buttons and CTAs" />
        <ColorBox color="bg-accent-1-light" usage="A lighter shade of the primary accent color for hover effects" />
        <ColorBox color="bg-stroke-base" usage="Color for dividers and subtle borders on a page" />
        <ColorBox color="bg-stroke-dimmed" usage="Separator for condensed content, like lists" />
      </div>

      <h3 className="font-bold mt-10 text-lg">Content Colors</h3>
      <p className="text-sm mb-6">Colors used for text content, icons, warnings, and other content</p>

      <div className="flex flex-col gap-4">
        <ColorText color="text-content-base" usage="Default color of all text content" />
        <ColorText color="text-content-dimmed" usage="Text content with less emphasis" />
        <ColorText color="text-content-subtle" usage="Barely visible color for text content" />
        <ColorText color="text-link-base" usage="Default color of all text links" />
        <ColorText color="text-link-hover" usage="Color of text links on hover" />
        <ColorText color="text-content-error" usage="Form errors, validation messages, etc..." />
      </div>
    </Section>
  );
}

function ColorText({ color, usage }: { color: string; usage: string }) {
  return (
    <div className="flex items-center gap-16">
      <div className="w-64">
        <div className="text-content-accent font-bold">{color}</div>
        <div className="text-xs">{usage}</div>
      </div>

      <span className={`font-medium ${color}`}>The quick brown fox jumps over the lazy dog</span>

      <div className="flex items-center gap-4">
        <Icons.IconTrash className={color} size={14} />
        <Icons.IconUsers className={color} size={14} />
        <Icons.IconRefresh className={color} size={14} />
        <Icons.IconSettings className={color} size={14} />
        <Icons.IconSearch className={color} size={14} />
        <Icons.IconX className={color} size={14} />
      </div>
    </div>
  );
}

function ColorBox({ color, usage }: { color: string; usage: string }) {
  return (
    <div className="flex items-start gap-4">
      <ColorShowcase color={color} />
      <ColorDetails color={color} usage={usage} />
    </div>
  );
}

function ColorShowcase({ color }: { color: string }) {
  return <div className={`w-12 h-12 ${color} border border-surface-outline rounded`}></div>;
}

function ColorDetails({ color, usage }: { color: string; usage: string }) {
  return (
    <div>
      <div className="text-content-accent font-bold">{color.slice(3)}</div>
      <div className="text-xs">{usage}</div>
    </div>
  );
}
