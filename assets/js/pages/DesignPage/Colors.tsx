import * as React from "react";

export function Colors() {
  return (
    <div className="mt-10">
      <div className="text-content-accent text-xl font-bold">Colors</div>

      <div className="max-w-2xl mt-2 mb-10">
        Operately uses semantic color names to define the color palette, which means that the color names are based on
        their usage rather than their appearance. You should always use these colors in the application so we can
        maintain a consistent look and feel, and easily make changes in the future.
      </div>

      <div className="grid grid-cols-2 gap-8">
        <Color color="bg-base" usage="Background color of the application" />
        <Color color="bg-surface" usage="Color of the UI surface" />
        <Color color="bg-surface-dimmed" usage="Dimmed version of the UI surface, used for page footers" />
        <Color color="bg-surface-accent" usage="Accent color of the UI surface, used for subtle highlights" />
        <Color color="bg-surface-outline" usage="Outline color of the UI surface, used for borders" />
        <Color color="bg-surface-highlight" usage="Highlight color of the UI surface, used for hover effects" />
        <Color color="bg-content-base" usage="Default color of all text content" />
        <Color color="bg-content-accent" usage="Accent color for text content" />
        <Color color="bg-content-dimmed" usage="Dimmed color for text content" />
        <Color color="bg-content-subtle" usage="Barely visible color for text content" />
        <Color color="bg-stroke-base" usage="Color for dividers and subtle borders on a page" />
        <Color color="bg-link-base" usage="Default color for links" />
        <Color color="bg-link-hover" usage="Hover color for links" />
        <Color color="bg-accent-1" usage="Primary accent color in the application" />
        <Color color="bg-red-500" usage="Error color for alerts and notifications" />
      </div>
    </div>
  );
}

function Color({ color, usage }: { color: string; usage: string }) {
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
      <div className="text-sm">{usage}</div>
    </div>
  );
}