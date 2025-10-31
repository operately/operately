import type { Meta, StoryObj } from "@storybook/react";
import { AccountPage } from "./index";

const meta = {
  title: "Pages/AccountPage",
  component: AccountPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockPerson: AccountPage.Person = {
  id: "1",
  fullName: "John Johnson",
  email: "john.johnson@company.com",
  avatarUrl: "https://i.pravatar.cc/150?img=12",
};

const defaultArgs = {
  person: mockPerson,
  profilePath: "#",
  appearancePath: "#",
  securityPath: "#",
  homePath: "#",
  onLogOut: () => console.log("Sign out clicked"),
};

export const Default: Story = {
  args: defaultArgs,
};

export const WithoutAvatar: Story = {
  args: {
    ...defaultArgs,
    person: {
      ...mockPerson,
      avatarUrl: null,
    },
  },
};

export const LongName: Story = {
  args: {
    ...defaultArgs,
    person: {
      ...mockPerson,
      fullName: "Dr. Alexander Benjamin Christopher Davidson-Wellington III",
      email: "alexander.benjamin.christopher@very-long-company-domain.com",
    },
  },
};

export const Mobile: Story = {
  args: defaultArgs,
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const Tablet: Story = {
  args: defaultArgs,
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};
