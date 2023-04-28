import React from 'react';

import Avatar, {AvatarSize} from '../../components/Avatar';
import Icon from '../../components/Icon';

import { gql, useQuery, useApolloClient } from '@apollo/client';
import { setObjectiveOwner } from '../../graphql/Objectives';
import { createProfile } from '../../graphql/People';

import * as Popover from '@radix-ui/react-popover';

const debounce = (callback: any, wait : number) => {
  let timeoutId : number | null = null;

  return (...args : any[]) => {
    if(timeoutId) window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

const SEARCH_PEOPLE = gql`
  query SearchPeople($query: String!) {
    searchPeople(query: $query) {
      id
      fullName
      title
      avatarUrl
    }
  }
`;

function CardButton({title, onClick}) {
  return (
    <div onClick={onClick} className="block px-2 py-1 rounded cursor-pointer outline-0 hover:text-dark-1 border border-dark-8% hover:border-brand-base hover:text-brand-base">
      {title}
    </div>
  );
}

type Screen = "default" | "setChampion" | "createProfile";

function Profile({objective, onSeeProfile, onUnassign, onChangeChampion}) : JSX.Element {
  return <div>
    <div className="w-56 p-2 flex flex-col items-center">
      <div className="my-2 flex flex-col items-center">
        <Avatar person={objective.owner} size={AvatarSize.XXLarge} />
      </div>
      <div className="text-center">
        <div className="font-semibold">{objective.owner.fullName}</div>
        <div className="text-sm text-dark-2">{objective.owner.title} at Acme Incorporated</div>
      </div>
    </div>

    <div className="flex flex-col gap-1">
      <CardButton title="See profile" onClick={onSeeProfile} />
      <CardButton title="Unassign" onClick={onUnassign} />
      <CardButton title="Change Champion" onClick={onChangeChampion} />
    </div>
  </div>;
}

function SelectChampion({objective, onCreateNewProfile, onSelectChampion}) : JSX.Element {
  const client = useApolloClient();
  const [searchQuery, setSearchQuery] = React.useState("");
  const {data, loading, error} = useQuery(SEARCH_PEOPLE, {
    variables: {query: searchQuery}
  });

  const debouncedSetSearchQuery = React.useMemo(() => {
    return debounce((q : any) => {
      setSearchQuery(q)
    }, 500);
  }, []);

  const handleSetChampion = (personId : string) => async () => {
    await setObjectiveOwner(client, {id: objective.id, owner_id: personId});

    onSelectChampion();
  }

  return <div>
    <div className="font-bold text-xs mb-2" >Assign a champion</div>

    <input
      className="w-full outline-0 border border-dark-8% rounded px-2 py-1 mb-2"
      placeholder="Search&hellip;"
      onChange={(e) => debouncedSetSearchQuery(e.target.value)}
    />

    {loading || error
      ? <div>Loading&hellip;</div>
      : data.searchPeople.map((person : any) => (
        <div key={person.id} onClick={handleSetChampion(person.id)} className="flex items-center gap-2 outline-0 hover:bg-stone-100 cursor-pointer px-1 py-1 rounded">
          <Avatar person={person} size={AvatarSize.Tiny} /> {person.fullName}
        </div>
      ))
    }

    <div onClick={onCreateNewProfile} data-test-id="goal-create-profile" className="flex items-center gap-2 outline-0 hover:bg-stone-100 cursor-pointer px-1 py-1 rounded text-dark-2">
      <Icon name="plus" color="dark-2" size="small" /> Create new profile
    </div>
  </div>
}

function CreateProfile({objective, onCreateProfile, onCancel}) : JSX.Element {
  const client = useApolloClient();
  const [name, setName] = React.useState("John Doe");
  const [title, setTitle] = React.useState("Employee");

  const handleCreateProfile = async () => {
    const {data} = await createProfile(client, name, title);
    await setObjectiveOwner(client, {id: objective.id, owner_id: data.createProfile.id});

    onCreateProfile();
  }

  return <div>
    <div className="w-56 p-2 flex flex-col items-center">
      <div className="my-2 flex flex-col items-center">
        <Avatar person={{id: "", fullName: name}} size={AvatarSize.XXLarge} />
      </div>
      <div className="text-center">
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-dark-2">{title} at Acme Incorporated</div>
      </div>
    </div>

    <div className="flex flex-col gap-1">
      <div className="text-xs">Name</div>
      <input className="w-full outline-0 border border-dark-8% rounded px-2 py-1 mb-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="text-xs">Title in the company</div>
      <input className="w-full outline-0 border border-dark-8% rounded px-2 py-1 mb-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

      <button onClick={handleCreateProfile} className="cursor-pointer text-brand-base bg-brand-light-1 hover:bg-brand-light-2 px-2 py-1 rounded text-sm hover:underline">
        Create & Assign
      </button>
    </div>
  </div>;
}

export function GoalOwner({objective}) {
  const client = useApolloClient();
  const notAssignedAvatar = <div className="-ml-0.5"><Icon name="user" color="dark-2" /></div>;

  const [open, setOpen] = React.useState(false);
  const [screen, setScreen] = React.useState<Screen>("default");

  const handleUnassign = async () => {
    await setObjectiveOwner(client, {
      id: objective.id,
      owner_id: null
    })

    setOpen(false);
  }

  let content : JSX.Element | null = null;

  let handleSeeProfile = () => {
    console.log("See profile");
  };

  let handleChangeChampion = () => {
    setScreen("setChampion");
  };

  switch(screen) {
    case "default":
      if(objective.owner) {
        content = <Profile objective={objective} onSeeProfile={handleSeeProfile} onUnassign={handleUnassign} onChangeChampion={handleChangeChampion} />;
      } else {
        content = <SelectChampion objective={objective} onCreateNewProfile={() => setScreen("createProfile")} onSelectChampion={() => setOpen(false)} />;
      }
      break;

    case "setChampion":
      content = <SelectChampion objective={objective} onCreateNewProfile={() => setScreen("createProfile")} onSelectChampion={() => setOpen(false)} />;
      break;

    case "createProfile":
      content = <CreateProfile objective={objective} onCreateProfile={() => setOpen(false)} onCancel={() => setScreen("default")} />;
      break;
  }

  let trigger : JSX.Element | null = null;
  if(objective.owner) {
    trigger = <Avatar person={objective.owner} size={AvatarSize.Tiny} />;
  } else {
    trigger = notAssignedAvatar
  }

  const onOpenChange = (open : boolean) => {
    setOpen(open);
    setScreen("default");
  }

  return <Popover.Root open={open} modal={true} onOpenChange={onOpenChange}>
    <Popover.Trigger
      className="outline-0"
      children={trigger}
      data-test-id="goal-champion"
    />

    <Popover.Portal>
      <Popover.Content
        align="start"
        side="left"
        sideOffset={10}
        className={"w-60 bg-white p-2 gap-1 card-shadow border border-dark-8% rounded transition"}
        children={content}
      />
    </Popover.Portal>
  </Popover.Root>;
}

export function TargetOwner({target}) {
  return <></>;
}
