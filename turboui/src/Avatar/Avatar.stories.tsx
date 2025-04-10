import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarList, AvatarWithName } from '.';
import { AvatarProps } from './types';

const meta = {
  title: 'Components/Avatar',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: 'The size of the avatar',
      options: ['tiny', 'small', 'normal', 'large', 'xlarge', 'xxlarge', 20, 24, 32, 40, 56, 96],
      control: { type: 'select' },
    },
    person: {
      description: 'The person to display in the avatar',
      control: 'object',
    },
  },
} satisfies Meta;

export default meta;

function genAvatar(id: string) {
  return `https://images.unsplash.com/${id}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
}

const EXAMPLE_PEOPLE = [
  {
    id: "bob_williams",
    fullName: "Bob Williams",
    title: "Chief Operating Officer (COO)",
    avatarUrl: genAvatar("photo-1500648767791-00dcc994a43e"),
  },
  {
    id: "charlie_davis",
    fullName: "Martin Smith",
    title: "Chief Financial Officer (CFO)",
    avatarUrl: genAvatar("photo-1472099645785-5658abf4ff4e"),
  },
  {
    id: "david_brown",
    fullName: "David Brown",
    title: "Chief Technology Officer (CTO)",
    avatarUrl: genAvatar("photo-1491528323818-fdd1faba62cc"),
  },
  {
    id: "emily_davis",
    fullName: "Emily Davis",
    title: "Chief Marketing Officer (CMO)",
    avatarUrl: genAvatar("photo-1438761681033-6461ffad8d80"),
  },
  {
    id: "frank_miller",
    fullName: "Frank Miller",
    title: "VP of Product",
    avatarUrl: genAvatar("photo-1633332755192-727a05c4013d"),
  },
  {
    id: "grace_wilson",
    fullName: "Grace Wilson",
    title: "VP of Compliance",
    avatarUrl: genAvatar("photo-1494790108377-be9c29b29330"),
  },
  {
    id: "henry_taylor",
    fullName: "Henry Taylor",
    title: "VP of Engineering",
    avatarUrl: genAvatar("photo-1492562080023-ab3db95bfbce"),
  },
  {
    id: "ivy_anderson",
    fullName: "Ivy Anderson",
    title: "VP of Sales",
    avatarUrl: genAvatar("photo-1522075469751-3a6694fb2f61"),
  },
  {
    id: "jack_thomas",
    fullName: "Jack Thomas",
    title: "VP of Customer Success",
    avatarUrl: genAvatar("photo-1579038773867-044c48829161"),
  },
  {
    id: "karen_martinez",
    fullName: "Karen Martinez",
    title: "VP of Human Resources",
    avatarUrl: genAvatar("photo-1534528741775-53994a69daeb"),
  },
  {
    id: "liam_harris",
    fullName: "Liam Harris",
    title: "VP of Design",
    avatarUrl: genAvatar("photo-1489980557514-251d61e3eeb6"),
  },
  {
    id: "mia_clark",
    fullName: "Mia Clark",
    title: "Director of Engineering",
    avatarUrl: genAvatar("photo-1541823709867-1b206113eafd"),
  },
  {
    id: "nathan_morris",
    fullName: "Noah Lewis",
    title: "Director of Sales",
    avatarUrl: genAvatar("photo-1568602471122-7832951cc4c5"),
  },
  {
    id: "olivia_hall",
    fullName: "Olivia Hall",
    title: "Product Manager",
    avatarUrl: genAvatar("photo-1531123897727-8f129e1688ce"),
  },
  {
    id: "paul_young",
    fullName: "Paul Young",
    title: "Director of Business Development",
    avatarUrl: genAvatar("photo-1600180758890-6b94519a8ba6"),
  },
  {
    id: "quinn_walker",
    fullName: "Quinn Walker",
    title: "Director of Operations",
    avatarUrl: genAvatar("photo-1584999734482-0361aecad844"),
  },
  {
    id: "rachel_king",
    fullName: "Rachel King",
    title: "Director of Marketing",
    avatarUrl: genAvatar("photo-1502031882019-24c0bccfffc6"),
  },
  {
    id: "tina_scott",
    fullName: "Tina Scott",
    title: "Customer Support Representative",
    avatarUrl: genAvatar("photo-1700248356502-ca48ae3bafd6"),
  },
  {
    id: "walter_baker",
    fullName: "Walter Baker",
    title: "Lead Software Engineer",
    avatarUrl: genAvatar("photo-1521341957697-b93449760f30"),
  },
];

const defaultPerson = {
  id: "walter_baker",
  fullName: "Walter Baker",
  title: "Lead Software Engineer",
  avatarUrl: genAvatar("photo-1521341957697-b93449760f30"),
};

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
    size: 'normal',
  },
};

/**
 * When an avatar URL is provided, the component displays the image instead of initials.
 */
export const WithImage: StoryObj<AvatarProps> = {
  render: (args) => <Avatar {...args} />,
  args: {
    person: personWithAvatar,
    size: 'normal',
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
    size: 'normal',
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
            <Avatar person={EXAMPLE_PEOPLE[0]} size="tiny" />
            <span className="text-xs">tiny</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[1]} size="small" />
            <span className="text-xs">small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[2]} size="normal" />
            <span className="text-xs">normal</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[3]} size="large" />
            <span className="text-xs">large</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[4]} size="xlarge" />
            <span className="text-xs">xlarge</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[5]} size="xxlarge" />
            <span className="text-xs">xxlarge</span>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Custom numeric sizes</h3>
        <div className="flex items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[6]} size={20} />
            <span className="text-xs">20px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[7]} size={24} />
            <span className="text-xs">24px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[8]} size={32} />
            <span className="text-xs">32px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[9]} size={40} />
            <span className="text-xs">40px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[10]} size={56} />
            <span className="text-xs">56px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar person={EXAMPLE_PEOPLE[11]} size={96} />
            <span className="text-xs">96px</span>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * The AvatarWithName component combines an Avatar with the person's name.
 * It supports different name formats:
 * - full: Shows the full name (default)
 * - first: Shows only the first name
 * - short: Shows the first name and last name initial
 */
export const WithName: StoryObj<{}> = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h3 className="text-sm font-medium mb-1">Full name format</h3>
        <AvatarWithName person={EXAMPLE_PEOPLE[0]} size="normal" nameFormat="full" />
      </div>
      <div className="mb-2">
        <h3 className="text-sm font-medium mb-1">First name format</h3>
        <AvatarWithName person={EXAMPLE_PEOPLE[1]} size="normal" nameFormat="first" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-1">Short name format</h3>
        <AvatarWithName person={EXAMPLE_PEOPLE[2]} size="normal" nameFormat="short" />
      </div>
    </div>
  ),
};

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
