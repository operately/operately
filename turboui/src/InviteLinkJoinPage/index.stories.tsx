import type { Meta, StoryObj } from "@storybook/react-vite";
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

export const LoggedInUserValidTokenState: Story = {
  args: {
    pageState: "logged-in-user-valid-token",
    invitation: {
      company: {
        id: "1",
        name: "Textered Rend",
      },
      author: author,
    },
    token: "valid-token",
    handleJoin: () => {},
    handleSignUpAndJoin: () => {},
    handleLogInAndJoin: () => {},
  },
};

export const AnnonymousUserValidTokenState: Story = {
  args: {
    pageState: "anonymous-user-valid-token",
    invitation: {
      company: {
        id: "1",
        name: "Textered Rend",
      },
      author: author,
    },
    token: "valid-token",
    handleJoin: () => {},
    handleSignUpAndJoin: () => {},
    handleLogInAndJoin: () => {},
  },
};

export const ExpiredTokenState: Story = {
  args: {
    pageState: "expired-token",
    invitation: {
      company: {
        id: "1",
        name: "Textered Rend",
      },
      author: author,
    },
    token: "expired-token",
    handleJoin: () => {},
    handleSignUpAndJoin: () => {},
    handleLogInAndJoin: () => {},
  },
};

export const RevokedTokenState: Story = {
  args: {
    pageState: "revoked-token",
    invitation: {
      company: {
        id: "1",
        name: "Textered Rend",
      },
      author: author,
    },
    token: "revoked-token",
    handleJoin: () => {},
    handleSignUpAndJoin: () => {},
    handleLogInAndJoin: () => {},
  },
};

export const InvalidTokenState: Story = {
  args: {
    pageState: "invalid-token",
    invitation: null,
    token: "invalid-token",
    handleJoin: () => {},
    handleSignUpAndJoin: () => {},
    handleLogInAndJoin: () => {},
  },
};
