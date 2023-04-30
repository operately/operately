import React from "react";

import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";

import { useApolloClient } from "@apollo/client";
import { setObjectiveOwner } from "../../graphql/Objectives";
import { createProfile, useDebouncedPeopleSearch } from "../../graphql/People";

import * as Popover from "../../components/Popover";

type Screen = "default" | "setChampion" | "createProfile";

function Profile({
  objective,
  onSeeProfile,
  onUnassign,
  onChangeChampion,
}): JSX.Element {
  return (
    <div>
      <div className="w-56 p-2 flex flex-col items-center">
        <div className="my-2 flex flex-col items-center">
          <Avatar person={objective.owner} size={AvatarSize.XXLarge} />
        </div>
        <div className="text-center">
          <div className="font-semibold">{objective.owner.fullName}</div>
          <div className="text-sm text-dark-2">
            {objective.owner.title} at Acme Incorporated
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Popover.Button children="See profile" onClick={onSeeProfile} />
        <Popover.Button
          children="Unassign"
          data-test-id="unassignChampion"
          onClick={onUnassign}
        />
        <Popover.Button children="Change Champion" onClick={onChangeChampion} />
      </div>
    </div>
  );
}

function SelectChampion({
  objective,
  onCreateNewProfile,
  onSelectChampion,
}): JSX.Element {
  const client = useApolloClient();
  const { data, loading, error, setSearchQuery } = useDebouncedPeopleSearch("");

  const handleSetChampion = (personId: string) => async () => {
    await setObjectiveOwner(client, { id: objective.id, owner_id: personId });

    onSelectChampion();
  };

  return (
    <div>
      <div className="font-bold text-xs mb-2">Assign a champion</div>

      <input
        className="w-full outline-0 border border-dark-8% rounded px-2 py-1 mb-2"
        placeholder="Search&hellip;"
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading || error ? (
        <div>Loading&hellip;</div>
      ) : (
        data.searchPeople.map((person: any) => (
          <div
            key={person.id}
            onClick={handleSetChampion(person.id)}
            className="flex items-center gap-2 outline-0 hover:bg-stone-100 cursor-pointer px-1 py-1 rounded"
          >
            <Avatar person={person} size={AvatarSize.Tiny} /> {person.fullName}
          </div>
        ))
      )}

      <div
        onClick={onCreateNewProfile}
        data-test-id="createNewProfile"
        className="flex items-center gap-2 outline-0 hover:bg-stone-100 cursor-pointer px-1 py-1 rounded text-dark-2"
      >
        <Icon name="plus" color="dark-2" size="small" /> Create new profile
      </div>
    </div>
  );
}

function CreateProfile({ objective, onCreateProfile }): JSX.Element {
  const client = useApolloClient();
  const [name, setName] = React.useState("John Doe");
  const [title, setTitle] = React.useState("Employee");

  const handleCreateProfile = async () => {
    const { data } = await createProfile(client, name, title);
    await setObjectiveOwner(client, {
      id: objective.id,
      owner_id: data.createProfile.id,
    });

    onCreateProfile();
  };

  return (
    <div>
      <div className="w-56 p-2 flex flex-col items-center">
        <div className="my-2 flex flex-col items-center">
          <Avatar
            person={{ id: "", fullName: name }}
            size={AvatarSize.XXLarge}
          />
        </div>
        <div className="text-center">
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-dark-2">
            {title} at Acme Incorporated
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-xs">Name</div>
        <input
          data-test-id="personFormNameInput"
          className="w-full outline-0 border border-dark-8% rounded px-2 py-1 mb-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="text-xs">Title in the company</div>
        <input
          data-test-id="personFormTitleInput"
          className="w-full outline-0 border border-dark-8% rounded px-2 py-1 mb-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <button
          data-test-id="createAndAssign"
          onClick={handleCreateProfile}
          className="cursor-pointer text-brand-base bg-brand-light-1 hover:bg-brand-light-2 px-2 py-1 rounded text-sm hover:underline"
        >
          Create & Assign
        </button>
      </div>
    </div>
  );
}

export function GoalOwner({ objective }) {
  const client = useApolloClient();

  const [open, setOpen] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>("default");

  const handleUnassign = async () => {
    await setObjectiveOwner(client, {
      id: objective.id,
      owner_id: null,
    });

    setOpen(false);
  };

  let content: JSX.Element | null = null;

  let handleSeeProfile = () => {
    console.log("See profile");
  };

  let handleChangeChampion = () => {
    setScreen("setChampion");
  };

  switch (screen) {
    case "default":
      if (objective.owner) {
        content = (
          <Profile
            objective={objective}
            onSeeProfile={handleSeeProfile}
            onUnassign={handleUnassign}
            onChangeChampion={handleChangeChampion}
          />
        );
      } else {
        content = (
          <SelectChampion
            objective={objective}
            onCreateNewProfile={() => setScreen("createProfile")}
            onSelectChampion={() => setOpen(false)}
          />
        );
      }
      break;

    case "setChampion":
      content = (
        <SelectChampion
          objective={objective}
          onCreateNewProfile={() => setScreen("createProfile")}
          onSelectChampion={() => setOpen(false)}
        />
      );
      break;

    case "createProfile":
      content = (
        <CreateProfile
          objective={objective}
          onCreateProfile={() => setOpen(false)}
          onCancel={() => setScreen("default")}
        />
      );
      break;
  }

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    setScreen("default");
  };

  return (
    <Popover.Root open={open} modal={true} onOpenChange={onOpenChange}>
      <Popover.Trigger className="outline-0" data-test-id="goalChampion">
        <Avatar person={objective.owner} size={AvatarSize.Tiny} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          data-test-id="championSelect"
          align="start"
          side="left"
          sideOffset={10}
          className="w-60 bg-white p-2 gap-1 card-shadow border border-dark-8% rounded transition"
          children={content}
        />
      </Popover.Portal>
    </Popover.Root>
  );
}

export function TargetOwner({ goal, target }) {
  const [open, setOpen] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>("default");

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    setScreen("default");
  };

  return (
    <Popover.Root open={open} modal={true} onOpenChange={onOpenChange}>
      <Popover.Trigger className="outline-0" data-test-id="goalChampion">
        <Avatar person={target.owner} size={AvatarSize.Tiny} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          data-test-id="championSelect"
          align="start"
          side="left"
          sideOffset={10}
          className="w-60 bg-white p-2 gap-1 card-shadow border border-dark-8% rounded transition"
          children={null}
        />
      </Popover.Portal>
    </Popover.Root>
  );
}
