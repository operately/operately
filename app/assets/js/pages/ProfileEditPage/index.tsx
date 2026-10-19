import * as React from "react";
import * as People from "@/models/people";

import { useNavigate } from "react-router";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { useTranslation } from "react-i18next";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { emptyContent, parseContent, ProfileEditPage } from "turboui";
import * as Blobs from "@/models/blobs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import type { PeopleUpdateInput } from "@/api";

import { loader, useLoadedData } from "./loader";
export type { FromLocation } from "./loader";

export default { name: "ProfileEditPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const me = useMe();
  const navigate = useNavigate();
  const { person, from } = useLoadedData();
  const { mutateAsync: updateProfile } = People.useUpdateProfile();

  const isCurrentUser = me?.id === person.id;

  // Form state
  const [fullName, setFullName] = React.useState(person.fullName || "");
  const [title, setTitle] = React.useState(person.title || "");
  const [aboutMe, setAboutMe] = React.useState(() => {
    if (!person.description) return emptyContent();
    return parseContent(person.description);
  });
  const [manager, setManager] = React.useState<ProfileEditPage.Person | null>(
    person.manager ? People.parsePersonForTurboUi(paths, person.manager) : null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const richTextHandlers = useRichEditorHandlers({ scope: People.CompanyWideSearchScope });

  // Avatar handlers
  const avatar = useAvatarHandlers(person.id);

  // Initialize avatar URL from person data
  React.useEffect(() => {
    avatar.setAvatarUrl(person.avatarUrl);
  }, [person.avatarUrl, avatar.setAvatarUrl]);

  // Manager search
  const transformPerson = React.useCallback(
    (person: People.Person) => People.parsePersonForTurboUi(paths, person)!,
    [paths],
  );

  const managerSearch = People.usePossibleManagersSearch({
    personId: person.id,
    transformResult: transformPerson,
  });

  // Form submit
  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true);

    try {
      const updateParams: PeopleUpdateInput = {
        id: person.id,
        fullName: fullName.trim(),
        title: title.trim(),
        managerId: manager?.id || null,
      };

      if (isCurrentUser) {
        updateParams.description = JSON.stringify(aboutMe);
      }

      await updateProfile(updateParams);

      if (isCurrentUser) {
        navigate(paths.accountPath());
      } else {
        navigate(paths.companyManagePeoplePath());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [fullName, title, aboutMe, manager, person.id, isCurrentUser, navigate, paths, updateProfile]);

  const displayPerson: ProfileEditPage.Person = {
    id: person.id,
    fullName: person.fullName || "",
    avatarUrl: avatar.avatarUrl,
    title: person.title,
    profileLink: paths.profilePath(person.id),
  };

  return (
    <ProfileEditPage
      person={displayPerson}
      fullName={fullName}
      title={title}
      aboutMe={aboutMe}
      manager={manager}
      onFullNameChange={setFullName}
      onTitleChange={setTitle}
      onAboutMeChange={setAboutMe}
      onManagerChange={setManager}
      onSubmit={handleSubmit}
      onAvatarUpload={avatar.handleAvatarUpload}
      onAvatarRemove={avatar.handleAvatarRemove}
      avatarUploading={avatar.avatarUploading}
      avatarUploadProgress={avatar.avatarUploadProgress}
      avatarError={avatar.avatarError}
      canChangeAvatar={true}
      managerSearch={managerSearch}
      richTextHandlers={richTextHandlers}
      localDraftKeyBase={`profile:${person.id}`}
      isCurrentUser={isCurrentUser}
      fromLocation={from}
      companyAdminPath={paths.companyAdminPath()}
      managePeoplePath={paths.companyManagePeoplePath()}
      homePath={paths.homePath()}
      isSubmitting={isSubmitting}
    />
  );
}

function useAvatarHandlers(personId: string) {
  const { t } = useTranslation();
  const { mutateAsync: updateProfilePicture } = People.useUpdateProfilePicture();
  const MAX_AVATAR_FILE_BYTES = 12 * 1024 * 1024; // 12 MB

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = React.useState<number | null>(null);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  const handleAvatarUpload = React.useCallback(
    async (file: File) => {
      if (file.size > MAX_AVATAR_FILE_BYTES) {
        setAvatarError(t("Please choose an image smaller than 12 MB."));
        return;
      }

      setAvatarError(null);
      setAvatarUploading(true);
      setAvatarUploadProgress(0);

      try {
        const { id, url } = await Blobs.uploadAvatarFile(file, (value) => setAvatarUploadProgress(value));
        const result = await updateProfilePicture({
          personId: personId,
          avatarBlobId: id,
          avatarUrl: url,
        });

        if (result?.person) {
          setAvatarUrl(result.person.avatarUrl ?? null);
        } else {
          setAvatarUrl(url);
        }
      } catch (err) {
        console.error(err);
        setAvatarError(t("Failed to upload avatar. Please try again."));
      } finally {
        setAvatarUploading(false);
        setAvatarUploadProgress(null);
      }
    },
    [personId, t, updateProfilePicture],
  );

  const handleAvatarRemove = React.useCallback(async () => {
    setAvatarError(null);
    setAvatarUploading(true);

    try {
      const result = await updateProfilePicture({
        personId: personId,
        avatarBlobId: null,
        avatarUrl: null,
      });

      if (result?.person) {
        setAvatarUrl(result.person.avatarUrl ?? null);
      } else {
        setAvatarUrl(null);
      }
    } catch (err) {
      console.error(err);
      setAvatarError(t("Failed to update avatar. Please try again."));
    } finally {
      setAvatarUploading(false);
    }
  }, [personId, t, updateProfilePicture]);

  return {
    avatarUrl,
    setAvatarUrl,
    avatarUploading,
    avatarUploadProgress,
    avatarError,
    handleAvatarUpload,
    handleAvatarRemove,
  };
}
