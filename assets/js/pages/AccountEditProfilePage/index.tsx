import React, { useRef, useState } from "react";

import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";

import PeopleSearch from "@/components/PeopleSearch";

import { FilledButton } from "@/components/Button";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useGetMe } from "@/models/people";

import classNames from "classnames";
import moment from "moment-timezone";
import Avatar from "@/components/Avatar";

export async function loader() {
  return null;
}

const dimmedClassName = classNames(
  "text-content-dimmed hover:text-content-hover",
  "underline underline-offset-2",
  "cursor-pointer",
  "transition-colors",
  "text-sm",
);

export function Page() {
  const { data } = useGetMe({ includeManager: true });

  if (!data) {
    return null;
  }

  const me = data.me;

  return (
    <Pages.Page title="Edit Profile">
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
    </Pages.Page>
  );
}

function FileInput({ onChange }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center">
        <FilledButton type="secondary" onClick={handleClick}>
          Upload Photo
        </FilledButton>

        <input ref={fileInputRef} onChange={onChange} type="file" accept="image/*" style={{ display: "none" }} />
      </div>
    </div>
  );
}

function ProfileForm({ me }) {
  const navigateToAccount = useNavigateTo("/account");

  const [name, setName] = useState(me.fullName);
  const [title, setTitle] = useState(me.title);
  const [manager, setManager] = useState(me.manager);
  const [managerStatus, setManagerStatus] = useState(me.manager ? "select-from-list" : "no-manager");
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl ? me.avatarUrl : "");
  const [blobId] = useState(me.avatarBlobId ? me.avatarBlobId : "");

  const [loading, setLoading] = useState(false);

  const [timezone, setTimezone] = useState(() => {
    if (me.timezone) {
      return { value: me.timezone, label: formatTimezone(me.timezone) };
    } else {
      return null;
    }
  });

  const timezones = moment.tz.names().map((tz) => ({
    value: tz,
    label: formatTimezone(tz),
  }));

  const verifyFields = () => {
    if (name.length === 0) {
      return false;
    }
    if (title.length === 0) {
      return false;
    }
    if (!timezone) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!verifyFields()) return;

    setLoading(true);

    await People.updateMyProfile({
      fullName: name,
      title: title,
      timezone: timezone?.value,
      managerId: managerStatus === "select-from-list" ? manager?.id : null,
      avatarUrl: avatarUrl,
      avatarBlobId: blobId,
    }).finally(() => setLoading(false));

    navigateToAccount();
  };

  const isValid = name.length > 0 && title.length > 0;

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
  };

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid}>
      <section className="flex flex-col w-full justify-center items-center text-center mt-4">
        <Avatar person={{ ...me, avatarUrl: avatarUrl }} size="xxlarge" />
        <div className="mt-2 flex flex-col gap-1">
          <FileInput onChange={async () => {}} />
          <button className={dimmedClassName} type="button" onClick={handleRemoveAvatar}>
            Remove Avatar and use my initials
          </button>
        </div>
      </section>

      <div>
        <Forms.TextInput value={name} onChange={setName} label="Name" error={name.length === 0} />
        {name.length === 0 && <div className="text-red-500">Name is required</div>}
      </div>

      <div>
        <Forms.TextInput value={title} onChange={setTitle} label="Title in the Company" error={title.length === 0} />
        {title.length === 0 && <div className="text-red-500">Role is required</div>}
      </div>

      <div>
        <Forms.SelectBox
          label={`Timezone`}
          placeholder="Select your timezone..."
          value={timezone}
          defaultValue={timezone}
          onChange={(option) => setTimezone(option)}
          options={timezones}
          data-test-id="timezone-selector"
        />
        {!timezone && <div className="text-red-500">Timezone is required</div>}
      </div>

      <ManagerSearch
        manager={manager}
        setManager={setManager}
        managerStatus={managerStatus}
        setManagerStatus={setManagerStatus}
      />

      <Forms.SubmitArea>
        <FilledButton type="primary" onClick={handleSubmit} loading={loading}>
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

function formatTimezone(timezone: string) {
  if (!timezone) return "";

  const offset = moment.tz(timezone).format("Z");
  const cities = timezone.split("/")!.slice(-1)![0]!.replace(/_/g, " ");
  return `(UTC${offset}) ${cities}`;
}
