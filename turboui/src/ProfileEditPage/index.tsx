import React from "react";
import { Page } from "../Page";
import { Avatar } from "../Avatar";
import { SecondaryButton, PrimaryButton } from "../Button";
import { Textfield } from "../forms/Textfield";
import { PersonField } from "../PersonField";

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
    timezone: string;
    manager: Person | null;
    
    // Form handlers
    onFullNameChange: (value: string) => void;
    onTitleChange: (value: string) => void;
    onTimezoneChange: (value: string) => void;
    onManagerChange: (person: Person | null) => void;
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
    
    // Options
    timezones: Timezone[];
    isCurrentUser: boolean;
    
    // Navigation paths
    fromLocation: string | null;
    companyAdminPath: string;
    managePeoplePath: string;
    accountPath: string;
    
    // State
    isSubmitting?: boolean;
  }
}

export function ProfileEditPage(props: ProfileEditPage.Props) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  
  const managerLabel = props.isCurrentUser ? "Who is your manager?" : "Who is their manager?";
  
  // Build navigation based on fromLocation
  const navigation = React.useMemo(() => {
    if (props.fromLocation === "admin-manage-people") {
      return [
        { label: "Company Administration", to: props.companyAdminPath },
        { label: "Manage Team Members", to: props.managePeoplePath },
      ];
    } else {
      return [{ label: "Account", to: props.accountPath }];
    }
  }, [props.fromLocation, props.companyAdminPath, props.managePeoplePath, props.accountPath]);
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await props.onSubmit();
  };
  
  const previewPerson = {
    ...props.person,
    avatarUrl: props.person.avatarUrl ?? "",
  };
  
  return (
    <Page title="Edit Profile" size="small" navigation={navigation} testId="profile-edit-page">
      <div className="p-8">
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <section className="flex flex-col w-full justify-center items-center text-center mb-8">
            <Avatar person={previewPerson} size="xxlarge" />
            
            {props.canChangeAvatar && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <SecondaryButton
                    size="xs"
                    onClick={handleFileSelect}
                    disabled={props.avatarUploading}
                    type="button"
                  >
                    Change photo
                  </SecondaryButton>
                  
                  {props.person.avatarUrl && (
                    <SecondaryButton
                      size="xs"
                      onClick={props.onAvatarRemove}
                      disabled={props.avatarUploading}
                      type="button"
                    >
                      Remove
                    </SecondaryButton>
                  )}
                </div>
                
                {props.avatarUploading && (
                  <p className="text-sm text-content-dimmed mt-2">
                    {props.avatarUploadProgress !== null
                      ? `Uploading ${props.avatarUploadProgress}%`
                      : "Saving..."}
                  </p>
                )}
                
                {props.avatarError && (
                  <p className="text-sm text-callout-error-content mt-2">{props.avatarError}</p>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </section>
          
          {/* Form Fields */}
          <div className="space-y-4">
            <Textfield
              label="Name"
              value={props.fullName}
              onChange={(e) => props.onFullNameChange(e.target.value)}
              testId="profile-name-input"
              required
            />
            
            <Textfield
              label="Title in Company"
              value={props.title}
              onChange={(e) => props.onTitleChange(e.target.value)}
              testId="profile-title-input"
            />
            
            <div>
              <label className="font-bold text-sm mb-1 block">Timezone</label>
              <select
                value={props.timezone}
                onChange={(e) => props.onTimezoneChange(e.target.value)}
                className="w-full border border-stroke-base rounded-lg px-3 py-1.5 bg-surface-base text-content-base focus:outline-none focus:ring-2 focus:ring-primary-base"
                data-test-id="profile-timezone-select"
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
                testId="profile-manager-field"
                variant="form-field"
                emptyStateMessage="Select manager"
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="mt-6 flex gap-2">
            <PrimaryButton type="submit" loading={props.isSubmitting} testId="profile-save-button">
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
