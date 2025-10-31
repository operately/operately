import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { ProfileEditPage } from "./index";
import { genPerson, genPeople } from "../utils/storybook/genPeople";
import { usePersonFieldSearch } from "../utils/storybook/usePersonFieldSearch";

const meta: Meta<typeof ProfileEditPage> = {
  title: "Pages/ProfileEditPage",
  component: ProfileEditPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ProfileEditPage>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock timezones
const timezones: ProfileEditPage.Timezone[] = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

// Generate mock people for manager search
const potentialManagers = genPeople(15);

const DefaultStory = (args: Partial<ProfileEditPage.Props>) => {
  const currentPerson = args.person || genPerson();
  const [fullName, setFullName] = useState(currentPerson.fullName);
  const [title, setTitle] = useState(currentPerson.title || "");
  const [timezone, setTimezone] = useState("America/New_York");

  const [manager, setManager] = useState<ProfileEditPage.Person | null>(() => {
    if ("manager" in args) {
      // args.manager is explicitly set (could be null or a Person)
      const mgr = args.manager;
      return mgr === null || mgr === undefined ? null : mgr;
    }
    // args.manager is not set, use default (we know potentialManagers is not empty)
    return potentialManagers[0] as ProfileEditPage.Person;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentPerson.avatarUrl);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<number | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const managerSearch = usePersonFieldSearch(potentialManagers);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log("Submitting profile:", { fullName, title, timezone, manager });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert("Profile updated successfully!");
  };

  const handleAvatarUpload = async (file: File) => {
    console.log("Uploading avatar:", file.name);
    setAvatarUploading(true);
    setAvatarError(null);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setAvatarUploadProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Simulate successful upload
    const mockUrl = URL.createObjectURL(file);
    setAvatarUrl(mockUrl);
    setAvatarUploading(false);
    setAvatarUploadProgress(null);
  };

  const handleAvatarRemove = async () => {
    console.log("Removing avatar");
    setAvatarUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setAvatarUrl(null);
    setAvatarUploading(false);
  };

  const displayPerson: ProfileEditPage.Person = {
    ...currentPerson,
    avatarUrl: avatarUrl,
  };

  return (
    <ProfileEditPage
      person={displayPerson}
      fullName={fullName}
      title={title}
      timezone={timezone}
      manager={manager}
      onFullNameChange={setFullName}
      onTitleChange={setTitle}
      onTimezoneChange={setTimezone}
      onManagerChange={setManager}
      onSubmit={handleSubmit}
      onAvatarUpload={args.canChangeAvatar !== false ? handleAvatarUpload : undefined}
      onAvatarRemove={args.canChangeAvatar !== false ? handleAvatarRemove : undefined}
      avatarUploading={avatarUploading}
      avatarUploadProgress={avatarUploadProgress}
      avatarError={avatarError}
      canChangeAvatar={args.canChangeAvatar !== false}
      managerSearch={managerSearch}
      timezones={timezones}
      isCurrentUser={args.isCurrentUser ?? true}
      fromLocation={args.fromLocation ?? null}
      companyAdminPath="/admin"
      managePeoplePath="/admin/people"
      homePath="#"
      isSubmitting={isSubmitting}
    />
  );
};

export const UserEditingOwnProfile: Story = {
  render: () => <DefaultStory isCurrentUser={true} />,
};

export const AdminEditingOtherUser: Story = {
  render: () => <DefaultStory isCurrentUser={false} fromLocation="admin-manage-people" />,
};

export const UserWithoutAvatar: Story = {
  render: () => {
    const personWithoutAvatar = { ...genPerson(), avatarUrl: null };
    return <DefaultStory person={personWithoutAvatar} isCurrentUser={true} />;
  },
};

export const UserWithoutManager: Story = {
  render: () => {
    return <DefaultStory isCurrentUser={true} manager={null} />;
  },
};

export const AvatarUploadDisabled: Story = {
  render: () => <DefaultStory isCurrentUser={true} canChangeAvatar={false} />,
};

export const LongNameAndTitle: Story = {
  render: () => {
    const personWithLongDetails = {
      ...genPerson(),
      fullName: "Dr. Alexander Christopher Montgomery-Wellington III",
      title: "Senior Vice President of Global Strategic Initiatives and Business Development",
    };
    return <DefaultStory person={personWithLongDetails} isCurrentUser={true} />;
  },
};
