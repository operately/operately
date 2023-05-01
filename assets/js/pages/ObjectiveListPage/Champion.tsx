import React from "react";

import Avatar, { AvatarSize } from "../../components/Avatar";
import Icon from "../../components/Icon";

import { useApolloClient } from "@apollo/client";
import { setObjectiveOwner, setTargetOwner } from "../../graphql/Objectives";
import { createProfile, useDebouncedPeopleSearch } from "../../graphql/People";

import * as Popover from "../../components/Popover";

type Screen = "default" | "setChampion" | "createProfile";

function Profile({
  person,
  onSeeProfile,
  onUnassign,
  onChangeChampion,
}): JSX.Element {
  return (
    <div>
      <div className="w-56 p-2 flex flex-col items-center">
        <div className="my-2 flex flex-col items-center">
          <Avatar person={person} size={AvatarSize.XXLarge} />
        </div>
        <div className="text-center">
          <div className="font-semibold">{person.fullName}</div>
          <div className="text-sm text-dark-2">
            {person.title} at Acme Incorporated
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

function SelectChampion({ onCreateNewProfile, onSelectChampion }): JSX.Element {
  const { data, loading, error, setSearchQuery } = useDebouncedPeopleSearch("");

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
            onClick={onSelectChampion}
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

function CreateProfile({ createAndSetChampion }): JSX.Element {
  const [name, setName] = React.useState("John Doe");
  const [title, setTitle] = React.useState("Employee");

  const handleSubmit = async () => {
    await createAndSetChampion(name, title);
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
          onClick={handleSubmit}
          className="cursor-pointer text-brand-base bg-brand-light-1 hover:bg-brand-light-2 px-2 py-1 rounded text-sm hover:underline"
        >
          Create & Assign
        </button>
      </div>
    </div>
  );
}

function Owner({ person, dataTestID, setChampion }): JSX.Element {
  const client = useApolloClient();

  const [open, setOpen] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>("default");

  const handleUnassign = async () => {
    await setChampion(null);
    setOpen(false);
  };

  const handleSetChampion = async (personId: string) => {
    await setChampion(personId);
    setOpen(false);
  };

  const handleCreateAndSetChampion = async (name: string, title: string) => {
    const { data } = await createProfile(client, name, title);
    await setChampion(data.createPerson.id);
    setOpen(false);
  };

  let handleSeeProfile = () => console.log("see profile");
  let handleChangeChampion = () => setScreen("setChampion");

  let content: JSX.Element | null = null;

  switch (screen) {
    case "default":
      if (person) {
        content = (
          <Profile
            person={person}
            onSeeProfile={handleSeeProfile}
            onUnassign={handleUnassign}
            onChangeChampion={handleChangeChampion}
          />
        );
      } else {
        content = (
          <SelectChampion
            onCreateNewProfile={() => setScreen("createProfile")}
            onSelectChampion={handleSetChampion}
          />
        );
      }
      break;
    case "setChampion":
      content = (
        <SelectChampion
          onCreateNewProfile={() => setScreen("createProfile")}
          onSelectChampion={handleSetChampion}
        />
      );
      break;

    case "createProfile":
      content = (
        <CreateProfile createAndSetChampion={handleCreateAndSetChampion} />
      );
      break;
  }

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    setScreen("default");
  };

  return (
    <Popover.Root open={open} modal={true} onOpenChange={onOpenChange}>
      <Popover.Trigger className="outline-0" data-test-id={dataTestID}>
        <Avatar person={person} size={AvatarSize.Tiny} />
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

export function GoalOwner({ objective }) {
  const client = useApolloClient();

  const setChampion = async (personID: string | null) => {
    await setObjectiveOwner(client, { id: objective.id, owner_id: personID });
  };

  <Owner
    person={objective.owner}
    dataTestID="goalChampion"
    setChampion={setChampion}
  />;
}

export function TargetOwner({ target }) {
  const client = useApolloClient();

  const setChampion = async (personID: string | null) => {
    await setTargetOwner(client, { id: target.id, owner_id: personID });
  };

  <Owner
    person={target.owner}
    dataTestID="targetChampion"
    setChampion={setChampion}
  />;
}
