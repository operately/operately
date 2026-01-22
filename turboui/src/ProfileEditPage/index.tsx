import React from "react";
import { Page } from "../Page";
import { Avatar } from "../Avatar";
import { SecondaryButton, PrimaryButton } from "../Button";
import { Menu, MenuActionItem } from "../Menu";
import { Textfield } from "../forms/Textfield";
import { PersonField } from "../PersonField";
import { SwitchToggle } from "../SwitchToggle";
import { IconPencil } from "../icons";
import { Editor, useEditor } from "../RichEditor";
import { RichEditorHandlers } from "../RichEditor/useEditor";

export namespace ProfileEditPage {
  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    title?: string;
    profileLink?: string;
  }

  export interface Timezone {
    value: string;
    label: string;
  }

  export interface Props {
    // Person data
    person: Person;

    // Form fields
    fullName: string;
    title: string;
    aboutMe: any;
    timezone: string;
    manager: Person | null;
    notifyAboutAssignments: boolean;

    // Form handlers
    onFullNameChange: (value: string) => void;
    onTitleChange: (value: string) => void;
    onAboutMeChange: (value: any) => void;
    onTimezoneChange: (value: string) => void;
    onManagerChange: (person: Person | null) => void;
    onNotifyAboutAssignmentsChange: (value: boolean) => void;
    onSubmit: () => Promise<void>;
    onCancel?: () => void;

    // Avatar management
    onAvatarUpload?: (file: File) => Promise<void>;
    onAvatarRemove?: () => Promise<void>;
    avatarUploading?: boolean;
    avatarUploadProgress?: number | null;
    avatarError?: string | null;
    canChangeAvatar?: boolean;

    // Manager search
    managerSearch: PersonField.SearchData;

    // Rich text handlers
    richTextHandlers: RichEditorHandlers;

    // Options
    timezones: Timezone[];
    isCurrentUser: boolean;

    // Navigation paths
    fromLocation: string | null;
    companyAdminPath: string;
    managePeoplePath: string;
    homePath: string;

    // State
    isSubmitting?: boolean;
  }
}

export function ProfileEditPage(props: ProfileEditPage.Props) {
  const managerLabel = props.isCurrentUser ? "Who is your manager?" : "Who is their manager?";

  // Build navigation based on fromLocation
  const navigation = React.useMemo(() => {
    if (props.fromLocation === "admin-manage-people") {
      return [
        { label: "Company Administration", to: props.companyAdminPath },
        { label: "Manage Team Members", to: props.managePeoplePath },
      ];
    } else {
      return [{ label: "Home", to: props.homePath }];
    }
  }, [props.fromLocation, props.companyAdminPath, props.managePeoplePath, props.homePath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await props.onSubmit();
  };

  return (
    <Page title="Edit Profile" size="small" navigation={navigation} testId="profile-edit-page">
      <div className="p-8">
        <form onSubmit={handleSubmit}>
          <AvatarSection {...props} />

          {/* Form Fields */}
          <div className="space-y-4">
            <Textfield
              label="Name"
              value={props.fullName}
              onChange={(e) => props.onFullNameChange(e.target.value)}
              testId="name"
              required
            />

            <Textfield
              label="Title in Company"
              value={props.title}
              onChange={(e) => props.onTitleChange(e.target.value)}
              testId="title"
            />

            {props.isCurrentUser && (
              <div data-test-id="about-me">
                <label className="font-bold text-sm mb-1 block">About me</label>
                <AboutMeEditor
                  value={props.aboutMe}
                  onChange={props.onAboutMeChange}
                  handlers={props.richTextHandlers}
                />
              </div>
            )}

            <div>
              <label className="font-bold text-sm mb-1 block">Timezone</label>
              <select
                value={props.timezone}
                onChange={(e) => props.onTimezoneChange(e.target.value)}
                className="w-full border border-stroke-base rounded-lg px-3 py-1.5 bg-surface-base text-content-base focus:outline-none focus:ring-2 focus:ring-primary-base"
                data-test-id="timezone"
              >
                {props.timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Manager Section */}
            <div>
              <label className="font-bold text-sm mb-1 block">{managerLabel}</label>
              <PersonField
                person={props.manager}
                setPerson={props.onManagerChange}
                searchData={props.managerSearch}
                testId="manager"
                variant="form-field"
                emptyStateMessage="Select manager"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm mb-1">Assignments email</div>
                <div className="text-xs text-content-dimmed max-w-md">
                  Receive a daily email with your upcoming check-ins, reviews, and other work that needs your attention.
                </div>
              </div>

              <SwitchToggle
                label="Send assignments email"
                value={props.notifyAboutAssignments}
                setValue={props.onNotifyAboutAssignmentsChange}
                testId={props.notifyAboutAssignments ? "disable-assignments-email-toggle" : "enable-assignments-email-toggle"}
                labelHidden
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex gap-2">
            <PrimaryButton type="submit" loading={props.isSubmitting} testId="submit">
              Save Changes
            </PrimaryButton>

            {props.onCancel && (
              <SecondaryButton type="button" onClick={props.onCancel} disabled={props.isSubmitting}>
                Cancel
              </SecondaryButton>
            )}
          </div>
        </form>
      </div>
    </Page>
  );
}

function AboutMeEditor({
  value,
  onChange,
  handlers,
}: {
  value: any;
  onChange: (value: any) => void;
  handlers: RichEditorHandlers;
}) {
  const editor = useEditor({
    handlers,
    placeholder: "Share a short bio, what you work on, or anything you'd like others to know.",
    onUpdate: ({ json }) => onChange(json),
  });

  React.useEffect(() => {
    if (editor.editor) {
      editor.editor.commands.setContent(value);
    }
  }, [editor.editor]);

  return <Editor editor={editor} />;
}

function AvatarSection(props: ProfileEditPage.Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileSelect = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !props.onAvatarUpload) return;

      await props.onAvatarUpload(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [props.onAvatarUpload],
  );
  const handleChangePhotoClick = React.useCallback(() => {
    if (props.avatarUploading) return;
    handleFileSelect();
  }, [props.avatarUploading, handleFileSelect]);

  const handleRemovePhotoClick = React.useCallback(() => {
    if (props.avatarUploading) return;
    props.onAvatarRemove?.();
  }, [props.avatarUploading, props.onAvatarRemove]);

  const previewPerson = {
    ...props.person,
    avatarUrl: props.person.avatarUrl ?? "",
  };

  return (
    <section className="flex flex-col w-full justify-center items-center text-center mb-8">
      <div className="relative inline-block">
        <Avatar person={previewPerson} size="xxlarge" />

        {props.canChangeAvatar && (
          <Menu
            size="tiny"
            testId="profile-avatar-menu"
            customTrigger={
              <div className="absolute bottom-2 -right-7 opacity-85 hover:opacity-100 transition-all duration-200 focus:outline-none">
                <div className="flex items-center gap-0.5 text-xs text-content-dimmed cursor-pointer">
                  <IconPencil size={16} />
                  Edit
                </div>
              </div>
            }
          >
            <MenuActionItem onClick={handleChangePhotoClick} testId="profile-avatar-menu-change">
              Change photo
            </MenuActionItem>
            <MenuActionItem
              onClick={handleRemovePhotoClick}
              danger
              hidden={!props.person.avatarUrl}
              testId="profile-avatar-menu-remove"
            >
              Remove photo
            </MenuActionItem>
          </Menu>
        )}
      </div>

      {props.canChangeAvatar && (props.avatarUploading || props.avatarError) && (
        <div className="mt-4 space-y-2">
          {props.avatarUploading && (
            <p className="text-sm text-content-dimmed">
              {props.avatarUploadProgress !== null ? `Uploading ${props.avatarUploadProgress}%` : "Saving..."}
            </p>
          )}

          {props.avatarError && <p className="text-sm text-callout-error-content">{props.avatarError}</p>}
        </div>
      )}

      {props.canChangeAvatar && (
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      )}
    </section>
  );
}
