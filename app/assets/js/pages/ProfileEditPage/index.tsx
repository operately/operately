import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";
import * as Blobs from "@/models/blobs";
import * as React from "react";

import { useNavigate } from "react-router-dom";
import { Timezones } from "./timezones";

import Forms from "@/components/Forms";
import { useCurrentCompany, useMe } from "@/contexts/CurrentCompanyContext";
import { PageModule } from "@/routes/types";
import { Avatar, SecondaryButton } from "turboui";

import { usePaths } from "@/routes/paths";
export default { name: "ProfileEditPage", loader, Page } as PageModule;

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
  const { person } = Pages.useLoadedData() as LoaderResult;

  return (
    <Pages.Page title="Edit Profile">
      <Paper.Root size="small">
        <Navigation />
        <Paper.Body>
          <ProfileForm person={person} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

export type FromLocation = "admin-manage-people" | null;

function Navigation() {
  const paths = usePaths();
  const { from } = Pages.useLoadedData() as LoaderResult;

  if (from === "admin-manage-people") {
    return (
      <Paper.Navigation
        items={[
          { label: "Company Administration", to: paths.companyAdminPath() },
          { label: "Manage Team Members", to: paths.companyManagePeoplePath() },
        ]}
      />
    );
  } else {
    return <Paper.Navigation items={[{ label: "Account", to: paths.accountPath() }]} />;
  }
}

const ManagerOptions = [
  { value: "no-manager", label: "No manager" },
  { value: "select-from-list", label: "Select manager" },
];

function ProfileForm({ person }: { person: People.Person }) {
  const paths = usePaths();
  const me = useMe()!;
  const company = useCurrentCompany();
  const navigate = useNavigate();
  const managersLoader = People.usePossibleManagersSearch(person.id);

  const managerStatus = person.manager ? "select-from-list" : "no-manager";
  const managerLabel = me.id === person.id ? "Who is your manager?" : "Who is their manager?";

  const [avatar, setAvatar] = React.useState<{ blobId: string | null; url: string | null }>({
    blobId: person.avatarBlobId ?? null,
    url: person.avatarUrl ?? null,
  });
  const initialAvatarRef = React.useRef<{ blobId: string | null; url: string | null }>({
    blobId: person.avatarBlobId ?? null,
    url: person.avatarUrl ?? null,
  });
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const next = {
      blobId: person.avatarBlobId ?? null,
      url: person.avatarUrl ?? null,
    };

    setAvatar(next);
    initialAvatarRef.current = next;
  }, [person.avatarBlobId, person.avatarUrl]);

  const customAvatarEnabled = React.useMemo(() => {
    if (!company) return false;
    return Companies.hasFeature(company, "custom-avatar");
  }, [company]);

  const avatarDirty = React.useMemo(() => {
    if (!customAvatarEnabled) return false;

    const initial = initialAvatarRef.current;
    return (initial.blobId || null) !== (avatar.blobId || null) || (initial.url || null) !== (avatar.url || null);
  }, [avatar, customAvatarEnabled]);

  const form = Forms.useForm({
    fields: {
      name: person.fullName,
      title: person.title,
      timezone: person.timezone,
      manager: person.manager?.id,
      managerStatus: managerStatus,
    },
    submit: async () => {
      if (customAvatarEnabled && avatarDirty) {
        const result = await People.updateProfilePicture({
          personId: person.id,
          avatarBlobId: avatar.blobId,
          avatarUrl: avatar.url,
        });

        if (result.person) {
          const updated = {
            blobId: result.person.avatarBlobId ?? null,
            url: result.person.avatarUrl ?? null,
          };

          setAvatar(updated);
          initialAvatarRef.current = updated;
        } else {
          initialAvatarRef.current = avatar;
        }

        setAvatarError(null);
      }

      const managerId = form.values.managerStatus === "select-from-list" ? form.values.manager : null;

      await People.updateProfile({
        id: person.id,
        fullName: form.values.name?.trim(),
        title: form.values.title?.trim(),
        timezone: form.values.timezone,
        managerId: managerId,
      });

      if (me.id === person.id) {
        navigate(paths.accountPath());
      } else {
        navigate(paths.companyManagePeoplePath());
      }
    },
  });

  return (
    <Forms.Form form={form}>
      <BigAvatar
        person={person}
        avatar={avatar}
        onAvatarChange={setAvatar}
        uploading={uploadingAvatar}
        setUploading={setUploadingAvatar}
        uploadProgress={uploadProgress}
        setUploadProgress={setUploadProgress}
        avatarError={avatarError}
        setAvatarError={setAvatarError}
        featureEnabled={customAvatarEnabled}
        setFormState={form.actions.setState}
      />

      <Forms.FieldGroup>
        <Forms.TextInput field={"name"} label="Name" />
        <Forms.TextInput field={"title"} label="Title in Company" />
        <Forms.SelectBox field={"timezone"} label="Timezone" options={Timezones} />

        <Forms.FieldGroup>
          <Forms.RadioButtons field={"managerStatus"} label={managerLabel} options={ManagerOptions} />
          <Forms.SelectPerson
            field={"manager"}
            hidden={form.values.managerStatus !== "select-from-list"}
            default={person.manager}
            searchFn={managersLoader}
          />
        </Forms.FieldGroup>
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save Changes" />
    </Forms.Form>
  );
}

type AvatarState = { blobId: string | null; url: string | null };

function BigAvatar({
  person,
  avatar,
  onAvatarChange,
  uploading,
  setUploading,
  uploadProgress,
  setUploadProgress,
  avatarError,
  setAvatarError,
  featureEnabled,
  setFormState,
}: {
  person: People.Person;
  avatar: AvatarState;
  onAvatarChange: (value: AvatarState) => void;
  uploading: boolean;
  setUploading: (value: boolean) => void;
  uploadProgress: number | null;
  setUploadProgress: (value: number | null) => void;
  avatarError: string | null;
  setAvatarError: (value: string | null) => void;
  featureEnabled: boolean;
  setFormState: (state: any) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const previewPerson = React.useMemo(() => {
    return {
      ...person,
      avatarUrl: avatar.url ?? person.avatarUrl ?? "",
    };
  }, [person, avatar.url]);

  const handleFileSelect = React.useCallback(() => {
    setAvatarError(null);
    fileInputRef.current?.click();
  }, [setAvatarError]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setAvatarError(null);
      setUploadProgress(0);
      setUploading(true);
      setFormState("uploading");

      try {
        const result = await Blobs.uploadFile(file, (progress) => {
          setUploadProgress(progress);
        });

        onAvatarChange({ blobId: result.id, url: result.url });
      } catch (error) {
        console.error(error);
        setAvatarError("Failed to upload avatar. Please try again.");
      } finally {
        setUploading(false);
        setUploadProgress(null);
        setFormState("idle");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [onAvatarChange, setAvatarError, setFormState, setUploadProgress, setUploading],
  );

  const handleRemove = React.useCallback(() => {
    setAvatarError(null);
    onAvatarChange({ blobId: null, url: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onAvatarChange, setAvatarError]);

  return (
    <section className="flex flex-col w-full justify-center items-center text-center my-8">
      <Avatar person={previewPerson} size="xxlarge" />
      {featureEnabled && (
        <>
          <div className="flex items-center gap-2 mt-4">
            <SecondaryButton size="xs" onClick={handleFileSelect} disabled={uploading}>
              Change photo
            </SecondaryButton>
            {(avatar.blobId || avatar.url) && (
              <SecondaryButton size="xs" onClick={handleRemove} disabled={uploading}>
                Remove
              </SecondaryButton>
            )}
          </div>

          {uploading && (
            <p className="text-sm text-content-dimmed mt-2">
              {uploadProgress !== null ? `Uploading ${uploadProgress}%` : "Uploading..."}
            </p>
          )}

          {avatarError && <p className="text-sm text-callout-danger mt-2">{avatarError}</p>}

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
  );
}
