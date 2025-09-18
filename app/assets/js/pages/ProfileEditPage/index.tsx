import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as React from "react";

import { uploadFile } from "@/models/blobs";
import { useNavigate } from "react-router-dom";
import { Timezones } from "./timezones";

import Forms from "@/components/Forms";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { PageModule } from "@/routes/types";
import { Avatar } from "turboui";

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
  const navigate = useNavigate();
  const managersLoader = People.usePossibleManagersSearch(person.id);

  const managerStatus = person.manager ? "select-from-list" : "no-manager";
  const managerLabel = me.id === person.id ? "Who is your manager?" : "Who is their manager?";

  const form = Forms.useForm({
    fields: {
      name: person.fullName,
      title: person.title,
      timezone: person.timezone,
      manager: person.manager?.id,
      managerStatus: managerStatus,
    },
    submit: async () => {
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
      <BigAvatar person={person} />

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

function BigAvatar({ person }: { person: People.Person }) {
  return (
    <AvatarUploader person={person} />
  );
}

function AvatarUploader({ person }: { person: People.Person }) {
  const [uploading, setUploading] = React.useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentAvatarUrl = tempAvatarUrl || person.avatarUrl;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Upload the file
      const result = await uploadFile(file, () => {});
      
      // Update the profile with the new blob ID
      await People.updateProfile({
        id: person.id,
        avatarBlobId: result.id,
      });

      // Set temporary URL for immediate visual feedback
      const objectUrl = URL.createObjectURL(file);
      setTempAvatarUrl(objectUrl);
      
      // Clean up object URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        setTempAvatarUrl(null);
      }, 2000);

    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="flex flex-col w-full justify-center items-center text-center my-8">
      <div className="relative group cursor-pointer" onClick={handleClick}>
        <Avatar person={{ ...person, avatarUrl: currentAvatarUrl }} size="xxlarge" />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
          {uploading ? (
            <div className="text-white text-sm">Uploading...</div>
          ) : (
            <div className="text-white text-sm">Change Photo</div>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <p className="text-sm text-gray-500 mt-2">
        Click to change your profile photo
      </p>
    </section>
  );
}
