import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SlideIn } from "./index";
import { PrimaryButton } from "../Button";

const meta = {
  title: "Components/SlideIn",
  component: SlideIn,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SlideIn>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component to demonstrate the slide-in
function SlideInDemo({ width = "60%", showHeader = true, title = "Slide-in Panel" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <PrimaryButton onClick={() => setIsOpen(true)}>Open Slide-in</PrimaryButton>

      <SlideIn isOpen={isOpen} onClose={() => setIsOpen(false)} width={width} showHeader={showHeader} title={title}>
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold">Content Area</h3>
          <p className="text-content-dimmed">
            This is the content area of the slide-in panel. It slides in from the right and darkens the background.
          </p>
          <p className="text-content-dimmed">
            You can click outside the panel or press ESC to close it. The panel width is customizable.
          </p>

          <div className="space-y-2 mt-8">
            <h4 className="font-semibold">Sample Content</h4>
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="p-4 bg-surface-highlight rounded border border-surface-outline">
                Item {i + 1}
              </div>
            ))}
          </div>
        </div>
      </SlideIn>
    </div>
  );
}

export const Default: Story = {
  render: () => <SlideInDemo />,
  args: {} as any,
};

export const NarrowWidth: Story = {
  render: () => <SlideInDemo width="40%" />,
  args: {} as any,
};

export const WideWidth: Story = {
  render: () => <SlideInDemo width="80%" />,
  args: {} as any,
};

export const NoHeader: Story = {
  render: () => <SlideInDemo showHeader={false} />,
  args: {} as any,
};

export const CustomHeader: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <PrimaryButton onClick={() => setIsOpen(true)}>Open with Custom Header</PrimaryButton>

        <SlideIn
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          header={
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-outline bg-gradient-to-r from-blue-500 to-purple-600">
              <div>
                <h2 className="text-lg font-semibold text-white">Custom Header</h2>
                <p className="text-sm text-white/80">With subtitle and gradient background</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white hover:text-white/80 transition-colors p-2">
                ✕
              </button>
            </div>
          }
        >
          <div className="p-6">
            <p>This slide-in has a custom header with gradient background.</p>
          </div>
        </SlideIn>
      </div>
    );
  },
  args: {} as any,
};

export const LongContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <PrimaryButton onClick={() => setIsOpen(true)}>Open with Long Content</PrimaryButton>

        <SlideIn isOpen={isOpen} onClose={() => setIsOpen(false)} title="Long Scrollable Content">
          <div className="p-6 space-y-4">
            {Array.from({ length: 50 }, (_, i) => (
              <div key={i} className="p-4 bg-surface-highlight rounded border border-surface-outline">
                <h4 className="font-semibold">Section {i + 1}</h4>
                <p className="text-sm text-content-dimmed mt-2">
                  This is a long content section to demonstrate scrolling behavior. The header stays fixed at the top
                  while the content scrolls.
                </p>
              </div>
            ))}
          </div>
        </SlideIn>
      </div>
    );
  },
  args: {} as any,
};

export const NoBackdropClose: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <PrimaryButton onClick={() => setIsOpen(true)}>Open (No Backdrop Close)</PrimaryButton>

        <SlideIn
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Cannot Close by Clicking Outside"
          closeOnBackdropClick={false}
        >
          <div className="p-6">
            <p className="text-content-dimmed mb-4">
              This slide-in cannot be closed by clicking the backdrop. You must use the close button or ESC key.
            </p>
            <PrimaryButton onClick={() => setIsOpen(false)}>Close</PrimaryButton>
          </div>
        </SlideIn>
      </div>
    );
  },
  args: {} as any,
};
