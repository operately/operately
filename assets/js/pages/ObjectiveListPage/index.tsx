import React from "react";
import { useTranslation } from 'react-i18next';

import { useApolloClient } from '@apollo/client';
import { useObjectives, listObjectives, createObjective, createKeyResult } from '../../graphql/Objectives';
import { Link } from 'react-router-dom';

import Avatar, {AvatarSize} from '../../components/Avatar';
import Icon from '../../components/Icon';

export async function ObjectiveListPageLoader(apolloClient : any) {
  await listObjectives(apolloClient, {});

  return {};
}

function AddGoalForm({onSubmit, onCancel}) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e : React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === "Enter") {
      onSubmit(ref.current?.value);
    }

    if(e.key === "Escape") {
      onCancel();
    }
  }

  return <div className="border bg-white border-dark-8% shadow rounded flex items-center text-dark-2 gap-2 px-2 py-2">
    <Icon
      name="objectives"
      size="small"
      color="brand"
    />

    <input
      ref={ref}
      data-test-id="goal-form-name-input"
      className="flex-1 outline-0 text-dark-1"
      placeholder="Describe a goal you want to achieve&hellip;"
      onKeyDown={handleKeyDown}
    />
  </div>;
}

function AddKeyResultForm({onSubmit, onCancel}) {
  const ref = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = async (e : React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === "Enter") {
      await onSubmit(ref.current?.value);

      if(ref.current) ref.current.value = "";
    }

    if(e.key === "Escape") {
      onCancel();
    }
  }

  return <div className="truncate px-2 py-2 flex justify-between items-center flex-1">
    <div className="flex items-center gap-2 flex-1">
      <div className="scale-75">
        <Icon name="flag" size="small" color="dark" />
      </div>
      <input ref={ref} className="flex-1 outline-0 text-dark-1" placeholder="Describe what needs to happen to reach this goal&hellip;" onKeyDown={handleKeyDown} />
    </div>
  </div>
}

function AddGoal({onGoalAdded, onActivation}) {
  const client = useApolloClient();
  const [formActive, setFormActive] = React.useState(false);

  const handleActivateForm = () => {
    onActivation();
    setFormActive(true);
  }

  const handleSubmit = async (name : string) => {
    const { data } = await createObjective(client, {
      input: {name: name}
    })

    onGoalAdded(data.createObjective.id);

    setFormActive(false);
  }

  const addGoalRow = <div
    data-test-id="goal-add-button"
    className="bg-white border border-dark-8% shadow-sm rounded flex items-center text-dark-2 gap-2 px-2 py-2 hover:text-dark-1 cursor-pointer"
    onClick={handleActivateForm}>
    <Icon name="plus" size="small" color="dark-2" />
    <div>add goal</div>
  </div>;

  if(formActive) {
    return <AddGoalForm onSubmit={handleSubmit} onCancel={() => setFormActive(false)} />;
  } else {
    return addGoalRow;
  }
}

function AddKeyResult({objectiveId, onKeyResultAdded}) {
  const client = useApolloClient();

  const handleSubmit = async (name : string) => {
    await createKeyResult(client, {
      input: {name: name, objectiveId: objectiveId}
    })

    onKeyResultAdded();
  }

  return <AddKeyResultForm onSubmit={handleSubmit} onCancel={() => null} />;
}

function KeyResultStatus({keyResult}) {
  let bgColor : string = "";

  switch(keyResult.status) {
    case "pending":
      bgColor = "border-stone-400";
      break;
  }

  return <div className="w-24 flex mr-4">
      <div className={`bg-white flex items-center justify-between px-2 py-0.5 rounded gap-1`}>
    <div className={`rounded-full w-3 h-3 ${bgColor} border-2`} />
    {keyResult.status}
  </div>
  </div>;
}

function KeyResultRow({objective, kr}) {
  return <div className="truncate px-2 py-2 flex justify-between items-center">

    <div className="flex items-center gap-2">
      <div className="scale-75">
        <Icon name="flag" size="small" color="dark" />
      </div>
      {kr.name}
    </div>

    <div className="flex items-center">
      <Group name={kr.group} />

      <div className="border-r border-dark-8% pr-2 w-24 flex mr-4">
        <KeyResultStatus keyResult={kr} />
      </div>

      {objective.owner
        ? <Avatar person={objective.owner} size={AvatarSize.Tiny} />
        : <Icon name="user" color="dark-2" />}
    </div>

  </div>;
}

function KeyResultList({objective, editing}) {
  if(!editing && objective.keyResults.length === 0) {
    return <div className="flex gap-2 px-4 py-2 text-dark-2">No assigned targets <Link to="" className="underline">add targets</Link></div>;
  }

  return <>
    {objective.keyResults.map((kr, i : number) => <KeyResultRow key={i} objective={objective} kr={kr} />)}

    {editing && <AddKeyResult objectiveId={objective.id} onKeyResultAdded={() => null} />}
  </>;
}

function Group({name}) {
  return <div className="border-r border-dark-8% pr-2 w-48 flex flex-row-reverse">
    <div className="text-dark-2 rounded px-1 py-0.5 gap-0.5 flex items-center">
      <div className="scale-75">
        <Icon name="groups" size="small" color="dark-2" />
      </div>
      not assigned
    </div>
  </div>;
}

function ObjectiveCard({objective, editing}) {
  return <div className="border border-stone-100 shadow rounded bg-white">
    <Link to={`/objectives/${objective.id}`} className="flex flex-1 block items-center gap-2 justify-between px-2 py-2">
      <div className="flex flex-1 items-center gap-2 font-semibold">
        <Icon name="objectives" size="small" color="brand" />
        {objective.name}
      </div>

      <div className="flex items-center">
        <Group name="marketing" />

        <KeyResultStatus keyResult={{status: "pending"}} />

        {objective.owner
          ? <Avatar person={objective.owner} size={AvatarSize.Tiny} />
          : <Icon name="user" color="dark-2" />}
      </div>
    </Link>

    <div className="border-t border-dark-8% divide-y divide-dark-8% flex flex-col">
      <KeyResultList objective={objective} editing={editing} />
    </div>
  </div>;
}


function ListOfObjectives({objectives, editing, onGoalAdded, onGoalAddingActivation}) {
  return <div className="flex flex-col gap-4" data-test-id="goal-list">
    {objectives.map((objective: any, i: number) =>
      <ObjectiveCard editing={objective.id === editing} key={i} objective={objective} />
    )}

    <AddGoal onGoalAdded={onGoalAdded} onActivation={onGoalAddingActivation} />
  </div>;
}

export function ObjectiveListPage() {
  const { t } = useTranslation();
  const { loading, error, data } = useObjectives({});

  const [editing, setEditing] = React.useState<string | null>(null);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const onGoalAdded = (id: string) => {
    setEditing(id);
  }

  const onGoalAddingActivation = () => {
    setEditing(null);
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="font-bold text-2xl">Acme Inc.</h1>
        <div className="text-dark-1">Sell the best possible boxes</div>
      </div>

      <div className="my-4 py-4">
        <h1 className="font-bold mb-4">Company goals</h1>
        <ListOfObjectives objectives={data.objectives} editing={editing} onGoalAdded={onGoalAdded} onGoalAddingActivation={onGoalAddingActivation} />
      </div>
    </>
  )
}
