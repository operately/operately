import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconHome, IconUser, IconSettings, IconBell, IconHeart, IconStar } from "../icons";
import { Page } from "../Page";

const meta = {
  title: "Design System/Colors",
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;

interface ColorSwatchProps {
  color: string;
  name: string;
  description: string;
  className?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, name, description, className = "" }) => (
  <div className={`flex items-center gap-3 p-3 ${className}`}>
    <div className={`w-12 h-12 rounded ${color} border border-gray-200`} />
    <div className="flex-1">
      <div className="font-bold">{name}</div>
      <div className="text-xs mt-0.5">{description}</div>
    </div>
  </div>
);

interface ColorSectionProps {
  title: string;
  colors: Array<{
    color: string;
    name: string;
    description: string;
  }>;
}

const ColorSection: React.FC<ColorSectionProps> = ({ title, colors }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <div className="text-sm mb-4">
      {title === "Background Colors" && "Colors used for backgrounds and surface."}
      {title === "Accent Colors" && "For badges, error states, callouts, tooltips"}
      {title === "Borders And Separators" && "Colors used for dividers, borders, and other separators"}
      {title === "Solid Colors" && "CTA, buttons, Avatar background, etc."}
      {title === "Text Colors" && "Colors used for text content, icons, warnings, and other content"}
      {title == "Brand Colors" &&
        "Used for brand identity and interactive elements like buttons, CTAs, checkboxes, etc."}
    </div>
    <div className="grid grid-cols-2 gap-x-6 gap-y-1">
      {colors.map((colorInfo, index) => (
        <ColorSwatch key={index} {...colorInfo} />
      ))}
    </div>
  </div>
);

interface TextColorDemoProps {
  textColor: string;
  name: string;
  description: string;
}

const TextColorDemo: React.FC<TextColorDemoProps> = ({ textColor, name, description }) => (
  <div className="grid grid-cols-3 gap-4 items-center p-3">
    <div>
      <div className="font-bold">{name}</div>
      <div className="text-xs mt-0.5">{description}</div>
    </div>
    <div>
      <div className={`${textColor} text-sm`}>The quick brown fox jumps over the lazy dog</div>
    </div>
    <div className="flex gap-4">
      <IconHome className={`${textColor} w-4 h-4`} />
      <IconUser className={`${textColor} w-4 h-4`} />
      <IconSettings className={`${textColor} w-4 h-4`} />
      <IconBell className={`${textColor} w-4 h-4`} />
      <IconHeart className={`${textColor} w-4 h-4`} />
      <IconStar className={`${textColor} w-4 h-4`} />
    </div>
  </div>
);

const TextColorSection: React.FC<{
  title: string;
  colors: Array<{ textColor: string; name: string; description: string }>;
}> = ({ title, colors }) => (
  <div className="mb-8">
    <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
    <div className="text-sm text-gray-600 mb-4">Colors used for text content, icons, warnings, and other content</div>
    <div className="space-y-1">
      {colors.map((colorInfo, index) => (
        <TextColorDemo key={index} {...colorInfo} />
      ))}
    </div>
  </div>
);

/**
 * Complete color palette used throughout the TurboUI design system.
 * These colors are defined as CSS custom properties and can be used with Tailwind CSS classes.
 */
export const AllColors: StoryObj = {
  render: () => (
    <Page title="Colors" size="large">
      <div className="p-8">
        <h1 className="text-2xl font-bold  mb-4">Colors</h1>
        <p className=" mb-8 leading-relaxed">
          Operately uses semantic color names to define the color palette, which means that the color names are based on
          their meaning rather than their appearance. You should always use these colors in the application so we can
          maintain a consistent look and feel, and easily make changes in the future.
        </p>

        <ColorSection
          title="Background Colors"
          colors={[
            {
              color: "bg-surface-bg",
              name: "surface-bg",
              description: "Background color of the application",
            },
            {
              color: "bg-surface-bg-highlight",
              name: "surface-bg-highlight",
              description: "Highlight color for the application background",
            },
            {
              color: "bg-surface-base",
              name: "surface-base",
              description: "Color of the UI surface",
            },
            {
              color: "bg-surface-dimmed",
              name: "surface-dimmed",
              description: "Dimmed version of the UI surface, used for page footers",
            },
            {
              color: "bg-surface-outline",
              name: "surface-outline",
              description: "Outline color of the UI surface, used for borders",
            },
            {
              color: "bg-surface-accent",
              name: "surface-accent",
              description: "Accent color of the UI surface, used for subtle highlights",
            },
            {
              color: "bg-surface-highlight",
              name: "surface-highlight",
              description: "Highlight color for UI surfaces",
            },
          ]}
        />

        <ColorSection
          title="Accent Colors"
          colors={[
            {
              color: "bg-callout-info-bg",
              name: "callout-info-bg",
              description: "Information callout background color",
            },
            {
              color: "bg-callout-info-content",
              name: "callout-info-content",
              description: "Information callout icon color",
            },
            {
              color: "bg-callout-warning-bg",
              name: "callout-warning-bg",
              description: "Warning callout background color",
            },
            {
              color: "bg-callout-warning-content",
              name: "callout-warning-content",
              description: "Warning callout content message color",
            },
            {
              color: "bg-callout-error-bg",
              name: "callout-error-bg",
              description: "Error callout background color",
            },
            {
              color: "bg-callout-error-content",
              name: "callout-error-content",
              description: "Error callout content message text",
            },
            {
              color: "bg-callout-success-bg",
              name: "callout-success-bg",
              description: "Success callout background color",
            },
            {
              color: "bg-callout-success-content",
              name: "callout-success-content",
              description: "Success callout content message text",
            },
          ]}
        />

        <ColorSection
          title="Brand Colors"
          colors={[
            {
              color: "bg-brand-1",
              name: "brand-1",
              description: "Primary brand color (#3185FF)",
            },
            {
              color: "bg-brand-2",
              name: "brand-2",
              description: "Secondary brand color (#E3F2FF)",
            },
          ]}
        />

        <ColorSection
          title="Borders And Separators"
          colors={[
            {
              color: "bg-stroke-base",
              name: "stroke-base",
              description: "Color for dividers and subtle borders on a page",
            },
            {
              color: "bg-stroke-dimmed",
              name: "stroke-dimmed",
              description: "Separator for condensed content, like lists",
            },
          ]}
        />

        <ColorSection
          title="Solid Colors [DEPRECATED, WILL BE REMOVED]"
          colors={[
            {
              color: "bg-accent-1",
              name: "accent-1",
              description: "Color that stands out, used for primary buttons and CTAs",
            },
            {
              color: "bg-accent-1-light",
              name: "accent-1-light",
              description: "A lighter shade of the primary accent color for hover effects",
            },
          ]}
        />

        <TextColorSection
          title="Text Colors"
          colors={[
            {
              textColor: "text-content-base",
              name: "text-content-base",
              description: "Default color of all text content",
            },
            {
              textColor: "text-content-dimmed",
              name: "text-content-dimmed",
              description: "Text content with less emphasis",
            },
            {
              textColor: "text-content-subtle",
              name: "text-content-subtle",
              description: "Barely visible color for text content",
            },
            {
              textColor: "text-content-error",
              name: "text-content-error",
              description: "Form errors, validation messages, etc.",
            },
            {
              textColor: "text-link-base",
              name: "text-link-base",
              description: "Default color of all text links",
            },
            {
              textColor: "text-link-hover",
              name: "text-link-hover",
              description: "Color of text links on hover",
            },
          ]}
        />

        <ColorSection
          title="Interactive Elements"
          colors={[
            {
              color: "bg-toggle-active",
              name: "toggle-active",
              description: "Active state color for toggles and switches",
            },
          ]}
        />

        <ColorSection
          title="Utility Colors"
          colors={[
            {
              color: "bg-success",
              name: "success",
              description:
                "Success color (#059669) introduced in anticipation of changing accent-1 color to brand blue",
            },
          ]}
        />
      </div>
    </Page>
  ),
};
