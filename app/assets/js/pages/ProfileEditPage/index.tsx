import * as React from "react";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

import { useNavigate } from "react-router-dom";
import { Timezones } from "./timezones";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { PageModule } from "@/routes/types";
import { usePaths } from "@/routes/paths";
import { emptyContent, parseContent, ProfileEditPage } from "turboui";
import * as Blobs from "@/models/blobs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import type { UpdateProfileInput } from "@/api";

export default { name: "ProfileEditPage", loader, Page } as PageModule;

export type FromLocation = "admin-manage-people" | null;

interface LoaderResult {
  person: People.Person;
  from: FromLocation;
}

async function loader({ request, params }): Promise<LoaderResult> {
  return {
    person: await People.getPerson({ id: params.id, includeManager: true }).then((d) => d.person!),
    from: Pages.getSearchParam(request, "from") as FromLocation,
  };
}

function Page() {
  const paths = usePaths();
  const me = useMe()!;
  const navigate = useNavigate();
  const { person, from } = Pages.useLoadedData() as LoaderResult;

  const isCurrentUser = me.id === person.id;

  // Form state
  const [fullName, setFullName] = React.useState(person.fullName || "");
  const [title, setTitle] = React.useState(person.title || "");
  const [aboutMe, setAboutMe] = React.useState(() => {
    if (!person.description) return emptyContent();
    return parseContent(person.description);
  });
  const [timezone, setTimezone] = React.useState(person.timezone || "");
  const [notifyAboutAssignments, setNotifyAboutAssignments] = React.useState<boolean>(
    person.notifyAboutAssignments ?? false,
  );
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
      const updateParams: UpdateProfileInput = {
        id: person.id,
        fullName: fullName.trim(),
        title: title.trim(),
        timezone: timezone,
        managerId: manager?.id || null,
        notifyAboutAssignments,
      };

      if (isCurrentUser) {
        updateParams.description = JSON.stringify(aboutMe);
      }

      await People.updateProfile(updateParams);

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
  }, [
    fullName,
    title,
    aboutMe,
    timezone,
    manager,
    notifyAboutAssignments,
    person.id,
    isCurrentUser,
    navigate,
    paths,
  ]);

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
      timezone={timezone}
      manager={manager}
      notifyAboutAssignments={notifyAboutAssignments}
      onFullNameChange={setFullName}
      onTitleChange={setTitle}
      onAboutMeChange={setAboutMe}
      onTimezoneChange={setTimezone}
      onManagerChange={setManager}
      onNotifyAboutAssignmentsChange={setNotifyAboutAssignments}
      onSubmit={handleSubmit}
      onAvatarUpload={avatar.handleAvatarUpload}
      onAvatarRemove={avatar.handleAvatarRemove}
      avatarUploading={avatar.avatarUploading}
      avatarUploadProgress={avatar.avatarUploadProgress}
      avatarError={avatar.avatarError}
      canChangeAvatar={true}
      managerSearch={managerSearch}
      richTextHandlers={richTextHandlers}
      timezones={Timezones}
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
  const MAX_AVATAR_FILE_BYTES = 12 * 1024 * 1024; // 12 MB

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = React.useState<number | null>(null);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  const handleAvatarUpload = React.useCallback(
    async (file: File) => {
      if (file.size > MAX_AVATAR_FILE_BYTES) {
        setAvatarError("Please choose an image smaller than 12 MB.");
        return;
      }

      setAvatarError(null);
      setAvatarUploading(true);
      setAvatarUploadProgress(0);

      try {
        const { id, url } = await Blobs.uploadAvatarFile(file, (value) => setAvatarUploadProgress(value));
        const result = await People.updateProfilePicture({
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
        setAvatarError("Failed to upload avatar. Please try again.");
      } finally {
        setAvatarUploading(false);
        setAvatarUploadProgress(null);
      }
    },
    [personId],
  );

  const handleAvatarRemove = React.useCallback(async () => {
    setAvatarError(null);
    setAvatarUploading(true);

    try {
      const result = await People.updateProfilePicture({
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
      setAvatarError("Failed to update avatar. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  }, [personId]);

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
