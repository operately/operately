import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { AvatarList } from "../Avatar";
import { JoinSpacePrompt } from ".";

const meta = {
  title: "Pages/SpacePage",
  component: JoinSpacePrompt,
  args: {
    joining: false,
    onJoin: () => {},
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof JoinSpacePrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotAMember: Story = {
  render: (args) => <SpacePageStory joining={args.joining} onJoin={args.onJoin} />,
};

export const Joining: Story = {
  args: { joining: true },
  render: (args) => <SpacePageStory joining={args.joining} onJoin={args.onJoin} />,
};

function SpacePageStory({ joining, onJoin }: { joining: boolean; onJoin: () => void }) {
  return (
    <div className="min-h-screen bg-surface-dimmed py-px">
      <main className="relative mx-auto sm:my-10 sm:max-w-[90%] lg:max-w-6xl">
        <div className="relative min-h-dvh bg-surface-base sm:min-h-0 sm:rounded-lg sm:border sm:border-surface-outline sm:shadow-xl">
          <div className="px-4 py-10 sm:px-12">
            <header className="mt-2 text-center">
              <h1 className="text-4xl font-bold">Product &amp; Design</h1>
              <p className="mt-1">Build a product customers love and a brand they remember.</p>
            </header>

            <div className="mt-2 flex w-full items-center justify-center gap-2 font-medium">
              <AvatarList people={SPACE_MEMBERS} stacked size="small" maxElements={20} />
            </div>

            <JoinSpacePrompt joining={joining} onJoin={onJoin} />

            <section className="mt-6 py-6">
              <div className="flex flex-wrap items-start justify-center gap-4">
                <SpaceToolCard title="Goals & Projects">
                  <ToolSection title="Goals" items={["Grow product adoption", "Improve activation"]} />
                  <ToolSection title="Projects" items={["Mobile app launch", "Design system refresh"]} />
                </SpaceToolCard>

                <SpaceToolCard title="Discussions">
                  <Discussion author="MK" title="Q4 product priorities" detail="Where should we focus next quarter?" />
                  <Discussion author="JL" title="Research highlights" detail="Key takeaways from customer interviews" />
                  <Discussion author="AS" title="Design critique notes" detail="Decisions and follow-up items" />
                </SpaceToolCard>

                <SpaceToolCard title="Documents & Files">
                  <Document name="Product strategy" detail="Document · Updated 2 days ago" />
                  <Document name="Customer research" detail="Folder · 8 items" />
                  <Document name="Brand guidelines" detail="PDF · Updated last week" />
                </SpaceToolCard>
              </div>
            </section>

            <section className="-mx-4 -mb-10 mt-6 rounded-b-lg border-t border-surface-outline bg-surface-dimmed px-4 py-12 sm:-mx-12 sm:px-12">
              <h2 className="mb-2 text-xs font-semibold uppercase">Activity</h2>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  MK
                </div>
                <div>
                  <span className="font-semibold">Maya Kim</span> shared an update on Mobile app launch
                  <div className="text-xs text-content-subtle">Yesterday</div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

const SPACE_MEMBERS = [
  { id: "maya", fullName: "Maya Kim", avatarUrl: null },
  { id: "jordan", fullName: "Jordan Lee", avatarUrl: null },
  { id: "alex", fullName: "Alex Smith", avatarUrl: null },
  { id: "sam", fullName: "Sam Rivera", avatarUrl: null },
  { id: "taylor", fullName: "Taylor Chen", avatarUrl: null },
];

function SpaceToolCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-[380px] w-full max-w-[340px] overflow-hidden rounded-lg border border-stroke-base bg-surface-base text-xs shadow-sm">
      <h2 className="py-2 text-center text-base font-bold">{title}</h2>
      <div className="mx-2 rounded bg-surface-dimmed">{children}</div>
    </div>
  );
}

function ToolSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="px-3 py-3">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div className="flex items-center gap-2" key={item}>
            <div className="size-2 rounded-full bg-green-600" />
            <span className="flex-1 truncate">{item}</span>
            <div className="h-2 w-12 overflow-hidden rounded bg-surface-outline">
              <div className="h-full bg-green-600" style={{ width: `${index === 0 ? 72 : 44}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Discussion({ author, title, detail }: { author: string; title: string; detail: string }) {
  return (
    <div className="grid grid-cols-[2rem_1fr] items-center gap-1 border-b border-stroke-base px-2 py-2 last:border-b-0">
      <div className="flex size-[30px] items-center justify-center rounded-full bg-gray-500 text-[9px] font-extrabold text-white">
        {author}
      </div>
      <div className="overflow-hidden font-bold">
        <div className="truncate pr-2">{title}</div>
        <div className="truncate pr-2 font-normal">{detail}</div>
      </div>
    </div>
  );
}

function Document({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-stroke-base px-3 py-2 last:border-b-0">
      <div className="flex size-8 items-center justify-center rounded bg-blue-100 font-bold text-blue-700">D</div>
      <div className="min-w-0 leading-snug">
        <div className="truncate font-bold">{name}</div>
        <div className="truncate text-[10px] text-content-subtle">{detail}</div>
      </div>
    </div>
  );
}
