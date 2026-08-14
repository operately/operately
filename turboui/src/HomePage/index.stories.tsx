import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SecondaryButton } from "../Button";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { HomePage } from "./index";
import { MockFeed, mockSpaces, shortParagraphsRelease, v18ProductRelease } from "./mockData";

const meta = {
  title: "Pages/HomePage",
  component: HomePage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

const pageDefaults = {
  firstName: "Ada",
  now: new Date("2026-07-17T15:00:00"),
  spaces: mockSpaces,
  canCreateSpace: true,
  canInviteMembers: true,
  newSpaceLink: "/spaces/new",
  invitePeopleLink: "/people/invite",
  feed: <MockFeed />,
  formattedTimePreferences: defaultFormattedTimePreferences,
};

function InteractiveHomePage(
  props: Omit<HomePage.Props, "productRelease" | "onDismissProductRelease"> & {
    initialRelease: HomePage.Props["productRelease"];
  },
) {
  const [release, setRelease] = React.useState(props.initialRelease);

  return (
    <div className="relative min-h-screen">
      {release === null && props.initialRelease ? (
        <div className="fixed left-6 bottom-6 z-50">
          <SecondaryButton size="sm" onClick={() => setRelease(props.initialRelease)}>
            Reset announcement
          </SecondaryButton>
        </div>
      ) : null}

      <HomePage {...props} productRelease={release} onDismissProductRelease={() => setRelease(null)} />
    </div>
  );
}

export const Default: Story = {
  args: {
    ...pageDefaults,
    productRelease: v18ProductRelease,
    onDismissProductRelease: () => {},
  },
  render: () => <InteractiveHomePage {...pageDefaults} initialRelease={v18ProductRelease} />,
};

export const EmptySpaces: Story = {
  args: {
    ...pageDefaults,
    spaces: [],
    productRelease: v18ProductRelease,
    onDismissProductRelease: () => {},
  },
  render: () => <InteractiveHomePage {...pageDefaults} spaces={[]} initialRelease={v18ProductRelease} />,
};

export const TwoShortParagraphs: Story = {
  args: {
    ...pageDefaults,
    productRelease: shortParagraphsRelease,
    onDismissProductRelease: () => {},
  },
  render: () => <InteractiveHomePage {...pageDefaults} initialRelease={shortParagraphsRelease} />,
};

export const AlreadyDismissed: Story = {
  args: {
    ...pageDefaults,
    productRelease: null,
    onDismissProductRelease: () => {},
  },
};
