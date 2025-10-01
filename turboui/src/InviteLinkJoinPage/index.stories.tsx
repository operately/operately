import type { Meta, StoryObj } from "@storybook/react";
import { InviteLinkJoinPage } from ".";
import { genPerson } from "../utils/storybook/genPeople";

const meta = {
  title: "Pages/InviteLinkJoinPage",
  component: InviteLinkJoinPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof InviteLinkJoinPage>;

const author = genPerson();

export default meta;
type Story = StoryObj<typeof meta>;

export const ValidTokenState: Story = {
  args: {
    pageState: "valid-token",
    invitation: {
      id: "1",
      email: "user@example.com",
      company: {
        id: "1",
        name: "Textered Rend",
      },
      author: author,
    },
    token: "valid-token",
  },
};

export const ExpiredTokenState: Story = {
  args: {
    pageState: "expired-token",
    invitation: {
      id: "1",
      email: "user@example.com",
      company: {
        id: "1",
        name: "Textered Rend",
      },
      author: author,
    },
    token: "expired-token",
  },
};

export const RevokedTokenState: Story = {
  args: {
    pageState: "revoked-token",
    invitation: {
      id: "1",
      email: "user@example.com",
      company: {
        id: "1",
        name: "Textered Rend",
      },
      author: author,
    },
    token: "expired-token",
  },
};

export const InvalidTokenState: Story = {
  args: {
    pageState: "invalid-token",
    invitation: null,
    token: "invalid-token",
  },
};
