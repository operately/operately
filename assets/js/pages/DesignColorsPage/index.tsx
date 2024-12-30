import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"Colors"}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo="/__design__">Lobby</Paper.NavItem>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo="/__design__">Design System</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Paper.Header title="Colors" />

          <div className="mt-2 mb-10">
            Operately uses semantic color names to define the color palette, which means that the color names are based
            on their usage rather than their appearance. You should always use these colors in the application so we can
            maintain a consistent look and feel, and easily make changes in the future.
          </div>

          <h3 className="font-bold mt-4 text-lg">Background Colors</h3>
          <p className="text-sm mb-6">Colors used for the background and surface.</p>

          <div className="grid grid-cols-2 gap-8">
            <ColorBox color="bg-surface-bg" usage="Background color of the application" />
            <ColorBox color="bg-surface-highlight" usage="Highlight color for the application background" />
            <ColorBox color="bg-surface-base" usage="Color of the UI surface" />
            <ColorBox color="bg-surface-dimmed" usage="Dimmed version of the UI surface, used for page footers" />
            <ColorBox color="bg-surface-accent" usage="Accent color of the UI surface, used for subtle highlights" />
            <ColorBox color="bg-surface-outline" usage="Outline color of the UI surface, used for borders" />
            <ColorBox color="bg-surface-highlight" usage="Highlight color of the UI surface, used for hover effects" />
          </div>

          <h3 className="font-bold mt-12 text-lg">Interactive Components</h3>
          <p className="text-sm mb-6">Form background, callouts, etc...</p>

          <div className="grid grid-cols-2 gap-8">
            <ColorBox color="bg-callout-info" usage="Information callout background color" />
            <ColorBox color="bg-callout-info-icon" usage="Information callout icon color" />
            <ColorBox color="bg-callout-info-message" usage="Information callout message text" />
            <ColorBox color="bg-callout-warning" usage="Warning callout background color" />
            <ColorBox color="bg-callout-warning-icon" usage="Warning callout icon color" />
            <ColorBox color="bg-callout-warning-message" usage="Warning callout message text" />
            <ColorBox color="bg-callout-error" usage="Error callout background color" />
            <ColorBox color="bg-callout-error-icon" usage="Error callout icon color" />
            <ColorBox color="bg-callout-error-message" usage="Error callout message text" />
            <ColorBox color="bg-callout-success" usage="Success callout background color" />
            <ColorBox color="bg-callout-success-icon" usage="Success callout icon color" />
            <ColorBox color="bg-callout-success-message" usage="Success callout message text" />
          </div>

          <h3 className="font-bold mt-12 text-lg">Borders And Separators</h3>
          <p className="text-sm mb-6">Colors used for dividers, borders, and other separators</p>

          <div className="grid grid-cols-2 gap-8">
            <ColorBox color="bg-stroke-base" usage="Color for dividers and subtle borders on a page" />
            <ColorBox color="bg-stroke-dimmed" usage="Separator for condensed content, like lists" />
          </div>

          <h3 className="font-bold mt-12 text-lg">Solid Colors</h3>
          <p className="text-sm mb-6">CTA, Buttons, Avatar background, etc...</p>

          <div className="grid grid-cols-2 gap-8">
            <ColorBox color="bg-accent-1" usage="Color that stands out, used for primary buttons and CTAs" />
            <ColorBox color="bg-accent-1-light" usage="A lighter shade of the primary accent color for hover effects" />
          </div>

          <h3 className="font-bold mt-12 text-lg">Text Colors</h3>
          <p className="text-sm mb-6">Colors used for text content, icons, warnings, and other content</p>

          <div className="flex flex-col gap-4">
            <ColorText color="text-content-base" usage="Default color of all text content" />
            <ColorText color="text-content-dimmed" usage="Text content with less emphasis" />
            <ColorText color="text-content-subtle" usage="Barely visible color for text content" />
            <ColorText color="text-content-error" usage="Form errors, validation messages, etc..." />
            <ColorText color="text-link-base" usage="Default color of all text links" />
            <ColorText color="text-link-hover" usage="Color of text links on hover" />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
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
