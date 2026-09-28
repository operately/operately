import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocumentPublicSharingModal } from ".";

const meta: Meta<typeof DocumentPublicSharingModal> = {
  title: "Components/DocumentPublicSharingModal",
  component: DocumentPublicSharingModal,
  args: { isOpen: true, onClose: () => {}, publicUrl: null },
  render: (args) => {
    const [publicUrl, setPublicUrl] = React.useState(args.publicUrl);
    return (
      <DocumentPublicSharingModal
        {...args}
        publicUrl={publicUrl}
        onChange={async (enabled) => {
          setPublicUrl(enabled ? "https://app.operately.com/public/documents/example" : null);
        }}
      />
    );
  },
};
export default meta;
type Story = StoryObj<typeof DocumentPublicSharingModal>;
export const Private: Story = {};
export const Shared: Story = { args: { publicUrl: "https://app.operately.com/public/documents/example" } };
export const Failed: Story = {
  render: (args) => (
    <DocumentPublicSharingModal
      {...args}
      onChange={async () => {
        throw new Error("offline");
      }}
    />
  ),
};
