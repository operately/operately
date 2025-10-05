import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarList, AvatarWithName } from ".";
import { AvatarProps, AvatarSize } from "./types";
import { genPeople } from "./../utils/storybook/genPeople";

const meta = {
  title: "Components/Avatar",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      description: "The size of the avatar",
      options: ["tiny", "small", "normal", "large", "xlarge", "xxlarge", 20, 24, 32, 40, 56, 96],
      control: { type: "select" },
    },
    person: {
      description: "The person to display in the avatar",
      control: "object",
    },
  },
} satisfies Meta;

export default meta;

const EXAMPLE_PEOPLE = genPeople(10);
const defaultPerson = EXAMPLE_PEOPLE[0]!;
const personWithAvatar = EXAMPLE_PEOPLE[0];

/**
 * The Avatar component displays a user's profile picture or their initials as a fallback.
 * It's used to represent people in the interface and comes in various sizes.
 *
 * When an avatar URL is provided, it displays the image. Otherwise, it shows the person's initials.
 */
export const Default: StoryObj<AvatarProps> = {
  render: (args) => <Avatar {...args} />,
  args: {
    person: defaultPerson,
    size: "normal",
  },
};

/**
 * When an avatar URL is provided, the component displays the image instead of initials.
 */
export const WithImage: StoryObj<AvatarProps> = {
  render: (args) => <Avatar {...args} />,
  args: {
    person: personWithAvatar,
    size: "normal",
  },
};

/**
 * When no avatar URL is provided, the component displays the person's initials as a fallback.
 * This demonstrates the component's built-in fallback mechanism.
 */
export const WithoutImage: StoryObj<AvatarProps> = {
  render: (args) => <Avatar {...args} />,
  args: {
    person: {
      id: "no_image_user",
      fullName: "Alex Johnson",
      avatarUrl: null,
    },
    size: "normal",
  },
};

/**
 * The Avatar component supports various predefined sizes:
 * - tiny: 20px
 * - small: 32px
 * - normal: 32px
 * - large: 40px
 * - xlarge: 56px
 * - xxlarge: 96px
 *
 * You can also provide a custom numeric size in pixels.
 */
export const Sizes: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Predefined sizes (with initials)</h3>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar person={defaultPerson} size="tiny" />
            <span className="text-xs">tiny</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={defaultPerson} size="small" />
            <span className="text-xs">small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={defaultPerson} size="normal" />
            <span className="text-xs">normal</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={defaultPerson} size="large" />
            <span className="text-xs">large</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={defaultPerson} size="xlarge" />
            <span className="text-xs">xlarge</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={defaultPerson} size="xxlarge" />
            <span className="text-xs">xxlarge</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Predefined sizes (with images)</h3>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[0]!} size="tiny" />
            <span className="text-xs">tiny</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[1]!} size="small" />
            <span className="text-xs">small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[2]!} size="normal" />
            <span className="text-xs">normal</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[3]!} size="large" />
            <span className="text-xs">large</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[4]!} size="xlarge" />
            <span className="text-xs">xlarge</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[5]!} size="xxlarge" />
            <span className="text-xs">xxlarge</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Custom numeric sizes</h3>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[6]!} size={20} />
            <span className="text-xs">20px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[7]!} size={24} />
            <span className="text-xs">24px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[8]!} size={32} />
            <span className="text-xs">32px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[9]!} size={40} />
            <span className="text-xs">40px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[10]!} size={56} />
            <span className="text-xs">56px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[11]!} size={96} />
            <span className="text-xs">96px</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * The AvatarWithName component combines an Avatar with the person's name.
 * It supports different name formats and sizes.
 * - full: Shows the full name (default)
 * - first: Shows only the first name
 * - short: Shows the first name and last name initial
 *
 * It also supports all the same size options as the Avatar component.
 */
export const WithName: StoryObj<{}> = {
  render: () => (
    <div className="grid grid-cols-3 gap-12">
      {avatarConfigs.map((config) => (
        <AvatarWithNameBlock key={config.title} title={config.title} size={config.size as AvatarSize} />
      ))}
    </div>
  ),
};

const avatarConfigs = [
  { title: "Tiny Size", size: "tiny" },
  { title: "Small Size", size: "small" },
  { title: "Normal Size", size: "normal" },
  { title: "Large Size", size: "large" },
  { title: "XLarge Size", size: "xlarge" },
  { title: "Custom Size (48px)", size: 48 },
];

const AvatarWithNameBlock = ({ title, size }: { title: string; size: AvatarProps["size"] }) => (
  <div>
    <h2 className="text-base font-semibold mb-3">{title}</h2>
    <div className="flex flex-col gap-4">
      {["full", "first", "short"].map((nameFormat) => (
        <div key={nameFormat}>
          <h3 className="text-sm font-medium mb-1">{`${nameFormat} name format`}</h3>
          <AvatarWithName
            person={EXAMPLE_PEOPLE[0]!}
            size={size}
            nameFormat={nameFormat as "full" | "first" | "short"}
          />
        </div>
      ))}

      <div>
        <h3 className="text-sm font-medium mb-1">Without avatar (text only)</h3>
        <p className="text-xs text-content-dimmed mb-2">
          Set <code>showAvatar</code> to <code>false</code> to reuse the component when only the formatted name/link is
          needed.
        </p>
        <AvatarWithName person={EXAMPLE_PEOPLE[0]!} size={size} nameFormat="short" showAvatar={false} />
      </div>
    </div>
  </div>
);

/**
 * The AvatarList component displays a collection of avatars.
 * It can be configured to:
 * - Stack avatars with overlap
 * - Limit the number of displayed avatars
 * - Show a count of additional avatars
 * - Wrap to multiple lines
 */
export const AvatarListExample: StoryObj<{}> = {
  render: () => {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Default (unstacked)</h3>
          <AvatarList people={EXAMPLE_PEOPLE} size="normal" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Stacked</h3>
          <AvatarList people={EXAMPLE_PEOPLE} size="normal" stacked={true} />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Limited to 3 avatars</h3>
          <AvatarList people={EXAMPLE_PEOPLE} size="normal" maxElements={3} />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Stacked with custom spacing</h3>
          <AvatarList people={EXAMPLE_PEOPLE} size="normal" stacked={true} stackSpacing="-space-x-1" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Without cutoff indicator</h3>
          <AvatarList people={EXAMPLE_PEOPLE} size="normal" maxElements={3} showCutOff={false} />
        </div>
      </div>
    );
  },
};

/**
 * Edge cases for the Avatar component:
 * - Empty person object
 * - Missing fullName
 * - Invalid avatar URL
 */
export const EdgeCases: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Missing person (shows "?")</h3>
        <Avatar person={{ fullName: null }} size="normal" />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Empty fullName (shows empty avatar)</h3>
        <Avatar person={{ fullName: "" }} size="normal" />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Single name (shows first initial only)</h3>
        <Avatar person={{ fullName: "Mononym" }} size="normal" />
      </div>
    </div>
  ),
};
