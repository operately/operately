import * as React from "react";
import { Avatar, SecondaryButton } from "turboui";

import * as Blobs from "@/models/blobs";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import { useCurrentCompany } from "@/contexts/CurrentCompanyContext";

type AvatarState = { blobId: string | null; url: string | null };

interface Props {
  person: People.Person;
}

export default function BigAvatar({ person }: Props) {
  const company = useCurrentCompany();
  const featureEnabled = company && Companies.hasFeature(company, "custom-avatar");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const { avatar, uploadAvatar, removeAvatar, uploading, progress, error, resetError } = useAvatarMutation(person);

  const previewPerson = {
    ...person,
    avatarUrl: avatar.url ?? person.avatarUrl ?? "",
  };

  const handleFileSelect = React.useCallback(() => {
    resetError();
    fileInputRef.current?.click();
  }, [resetError]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      await uploadAvatar(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadAvatar],
  );

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
              <SecondaryButton
                size="xs"
                onClick={async () => {
                  await removeAvatar();
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={uploading}
              >
                Remove
              </SecondaryButton>
            )}
          </div>

          {uploading && (
            <p className="text-sm text-content-dimmed mt-2">
              {progress !== null ? `Uploading ${progress}%` : "Saving..."}
            </p>
          )}

          {error && <p className="text-sm text-callout-danger mt-2">{error}</p>}

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

function useAvatarMutation(person: People.Person) {
  const [avatar, setAvatar] = React.useState<AvatarState>({
    blobId: person.avatarBlobId ?? null,
    url: person.avatarUrl ?? null,
  });
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAvatar({
      blobId: person.avatarBlobId ?? null,
      url: person.avatarUrl ?? null,
    });
  }, [person.avatarBlobId, person.avatarUrl]);

  const uploadAvatar = React.useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const { id, url } = await Blobs.uploadFile(file, (value) => setProgress(value));
        const result = await People.updateProfilePicture({
          personId: person.id,
          avatarBlobId: id,
          avatarUrl: url,
        });

        if (result?.person) {
          setAvatar({
            blobId: result.person.avatarBlobId ?? null,
            url: result.person.avatarUrl ?? null,
          });
        } else {
          setAvatar({ blobId: id, url });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to upload avatar. Please try again.");
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [person.id],
  );

  const removeAvatar = React.useCallback(
    async () => {
      setError(null);
      setUploading(true);

      try {
        const result = await People.updateProfilePicture({
          personId: person.id,
          avatarBlobId: null,
          avatarUrl: null,
        });

        if (result?.person) {
          setAvatar({
            blobId: result.person.avatarBlobId ?? null,
            url: result.person.avatarUrl ?? null,
          });
        } else {
          setAvatar({ blobId: null, url: null });
        }
      } catch (err) {
        console.error(err);
        setError("Failed to update avatar. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [person.id],
  );

  const resetError = React.useCallback(() => setError(null), []);

  return { avatar, uploadAvatar, removeAvatar, uploading, progress, error, resetError };
}
