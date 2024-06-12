import React, { useRef, useState } from "react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import { useProfileMutation } from "@/graphql/Me";
import * as Forms from "@/components/Form";
import { useNavigateTo } from "@/routes/useNavigateTo";
import PeopleSearch from "@/components/PeopleSearch";
import { MultipartFileUploader } from "@/components/Editor/Blob/FileUploader";
import { useMe } from "@/models/people";
import { S3Upload } from "@/components/Editor/Blob/S3Upload/S3Upload";
import { CreateBlob } from "@/graphql/Blobs";
import moment from "moment-timezone";
import { FilledButton } from "@/components/Button";
import classnames from "classnames";
import Avatar from "@/components/Avatar";

export async function loader() {
  return null;
}

const dimmedClassName = classnames(
  "text-content-dimmed hover:text-content-hover",
  "underline underline-offset-2",
  "cursor-pointer",
  "transition-colors",
);

export function Page() {
  const { data } = useMe({ includeManager: true });

  if (!data) {
    return null;
  }

  const me = data.me;

  return (
    <Paper.Root size="small">
      <Paper.Navigation>
        <Paper.NavItem linkTo="/account">Account</Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body minHeight="300px">
        <div className="mt-8 flex flex-col gap-8">
          <ProfileForm me={me} />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function FileInput({ onChange, error }) {
  const className = useState(
    "relative m-0 block w-full min-w-0 flex-auto cursor-pointer rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] font-normal leading-[2.15] text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:cursor-pointer file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] hover:file:bg-neutral-200 focus:border-primary focus:text-neutral-700 focus:shadow-te-primary focus:outline-none dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-neutral-700 dark:file:text-neutral-100 dark:focus:border-primary",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <div className="flex-1">
        <FilledButton type="secondary" onClick={handleClick}>
          Upload Photo
        </FilledButton>
        <input
          ref={fileInputRef}
          className={error ? "border-red-500" : `${className}`}
          onChange={onChange}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

function ProfileForm({ me }) {
  const navigateToAccount = useNavigateTo("/account");
  const [update, { loading }] = useProfileMutation({
    onCompleted: navigateToAccount,
  });

  const [name, setName] = useState(me.fullName);
  const [title, setTitle] = useState(me.title);
  const [manager, setManager] = useState(me.manager);
  const [managerStatus, setManagerStatus] = useState(me.manager ? "select-from-list" : "no-manager");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ? me.avatarUrl : "");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileUploader = new MultipartFileUploader();

  const [timezone, setTimezone] = useState(() => {
    if (me.timezone) {
      return { value: me.timezone, label: formatTimezone(me.timezone) };
    } else {
      return null;
    }
  });

  async function S3FileUploader(file) {
    try {
      const response = await S3Upload(file);
      const url = response;
      setAvatarUrl(url);
    } catch (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  const timezones = moment.tz.names().map((tz) => ({
    value: tz,
    label: formatTimezone(tz),
  }));

  const handleSubmit = () => {
    update({
      variables: {
        input: {
          fullName: name,
          title: title,
          timezone: timezone?.value,
          managerId: managerStatus === "select-from-list" ? manager?.id : null,
          avatarUrl: avatarUrl,
        },
      },
    });
  };

  const handleFileUpload = async (file) => {
    const url = await fileUploader.upload(file, (progress) => {
      setUploadProgress(progress);
    });
    setAvatarUrl(url);
  };

  async function uploadFile(file) {
    const blob = await CreateBlob({ filename: file.name });

    if (blob.data.createBlob.storageType === "local") {
      await handleFileUpload(file);
    } else {
      await S3FileUploader(file);
    }
  }

  const isValid = name.length > 0 && title.length > 0;

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid}>
      <section className="flex flex-col w-full justify-center items-center text-center">
        {avatarUrl === null ? (
          <img src={avatarUrl} className="rounded-full w-24 h-24" />
        ) : (
          <Avatar person={me} size="xxlarge" />
        )}
        <div className="ml-4 mt-2">
          <FileInput
            onChange={async (e) => {
              const file = e.target.files[0];
              await uploadFile(file);
            }}
            error={false}
          />
          <button className={dimmedClassName} type="button" onClick={() => setAvatarUrl(null)}>
            Remove Avatar and Use Initials
          </button>
        </div>
      </section>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
      </div>

      <Forms.TextInput value={name} onChange={setName} label="Name" error={name.length === 0} />
      <Forms.TextInput value={title} onChange={setTitle} label="Title in the Company" error={title.length === 0} />

      <Forms.SelectBox
        label="Timezone"
        placeholder="Select your timezone..."
        value={timezone}
        defaultValue={timezone}
        onChange={(option) => setTimezone(option)}
        options={timezones}
        data-test-id="timezone-selector"
      />

      <ManagerSearch
        manager={manager}
        setManager={setManager}
        managerStatus={managerStatus}
        setManagerStatus={setManagerStatus}
      />

      <Forms.SubmitArea>
        <FilledButton type="primary" onClick={handleSubmit}>
          Save Changes
        </FilledButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}

function ManagerSearch({ manager, setManager, managerStatus, setManagerStatus }) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-semibold block mb-1">Who is your manager?</label>
      <div className="flex-1">
        <Forms.RadioGroup name="manager-status" defaultValue={managerStatus} onChange={setManagerStatus}>
          <Forms.Radio value="no-manager" label="I don't have a manager" />
          <Forms.Radio value="select-from-list" label="Select my manager from a list" />
        </Forms.RadioGroup>

        {managerStatus === "select-from-list" && (
          <div className="mt-2">
            <PeopleSearch
              onChange={(option) => setManager(option?.person)}
              defaultValue={manager}
              placeholder="Search for person..."
              inputId="manager-search"
              loader={loader}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimezone(timezone) {
  if (!timezone) return "";

  const offset = moment.tz(timezone).format("Z");
  const cities = timezone.split("/").slice(-1)[0].replace(/_/g, " ");
  return `(UTC${offset}) ${cities}`;
}
