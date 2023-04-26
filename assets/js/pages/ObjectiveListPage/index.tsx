import React from "react";
import { useTranslation } from 'react-i18next';

import { useObjectives, listObjectives } from '../../graphql/Objectives';
import { Link } from 'react-router-dom';

import ButtonLink from '../../components/ButtonLink';
import Card from '../../components/Card';
import CardList from '../../components/CardList';
import Avatar, {AvatarSize} from '../../components/Avatar';
import Icon from '../../components/Icon';

export async function ObjectiveListPageLoader(apolloClient : any) {
  await listObjectives(apolloClient, {});

  return {};
}

function KeyResultStatus({keyResult}) {
  const progress = Math.random() * 100;

  let bgColor : string = "";

  switch (true) {
    case progress < 33:
      bgColor = "bg-yellow-400"
      break;
    case progress < 66:
      bgColor = "bg-orange-200"
      break;
    default:
      bgColor = "bg-emerald-200"
      break;
  }

  return <div className={`bg-white flex items-center justify-between px-2 py-0.5 text-xs rounded gap-1`}>
    <div className={`rounded-full w-2 h-2 ${bgColor}`} />
    {keyResult.status}
  </div>
}

function ObjectiveCard({objective}) {
  return <div className="border border-stone-200 shadow-sm rounded">
    <Link to={`/objectives/${objective.id}`} className="flex flex-1 block items-center gap-2 justify-between px-2 py-2">
      <div className="max-w-2xl flex items-center gap-2 font-semibold">
        <Icon name="objectives" size="small" color="dark-2" />
        {objective.name}
      </div>

      <div className="flex items-center">
        <div className="border-r border-stone-200 pr-2 w-24 flex flex-row-reverse">
          <div className="rounded px-1 py-0.5 gap-0.5 text-xs flex items-center">
            <div className="scale-75">
              <Icon name="groups" size="small" color="dark" />
            </div>
            marketing
          </div>
        </div>

        <div className="border-r border-stone-200 w-24 flex mr-4">
          <KeyResultStatus keyResult={{status: "pending"}} />
        </div>

        <Avatar person={objective.owner} size={AvatarSize.Tiny} />
      </div>
    </Link>

    {objective.keyResults.length > 0 ?
      (<div className="border-t border-stone-200 divide-y flex flex-col text-sm">
      {objective.keyResults.map((kr) =>
        <div className="truncate px-2 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 pl-2">
            <div className="rounded-full border border-dark-2 w-2 h-2" />
            {kr.name}
          </div>

          <div className="flex items-center">
            <div className="border-r border-stone-200 pr-2 w-24 flex flex-row-reverse">
              <div className=" rounded px-1 py-0.5 gap-0.5 text-xs flex items-center">
                <div className="scale-75">
                  <Icon name="groups" size="small" color="dark" />
                </div>
                marketing
              </div>
            </div>

            <div className="border-r border-stone-200 pr-2 w-24 flex mr-4">
              <KeyResultStatus keyResult={kr} />
            </div>

            <Avatar person={objective.owner} size={AvatarSize.Tiny} />
          </div>
       </div>
      )}
    </div>)
    : <div className="border-t border-stone-200 divide-y flex text-sm text-dark-2 px-4 py-2 gap-3">
        No assigned targets <Link to={`/objectives/${objective.id}`} className="underline">add targets</Link>
      </div>
    }
  </div>;
}

function ListOfObjectives({objectives}) {
  // return (
  //   <CardList>
  //     {objectives.map((objective: any) => (
  //       <Link key={objective.name} to={`/objectives/${objective.id}`}>
  //         <Card>
  //           <div className="flex items-center gap-2 justify-between">
  //             <div className="max-w-2xl">
  //               <div className="text-brand-base font-bold">{objective.name}</div>
  //               <div className="text-dark-1 truncate">{objective.description}</div>
  //             </div>

  //             <div className="flex items-center gap-2">
  //               <Avatar person={objective.owner} size={AvatarSize.Normal} />

  //               <div>
  //                 <div className="font-medium">{objective.owner.fullName}</div>
  //                 <div className="text-xs">{objective.owner.title}</div>
  //               </div>
  //             </div>
  //           </div>
  //         </Card>
  //       </Link>
  //     ))}
  //   </CardList>
  // );

  return <div className="flex flex-col gap-2">
    {objectives.map((objective: any) => <ObjectiveCard objective={objective} />)}
  </div>;
}

export function ObjectiveListPage() {
  const { t } = useTranslation();
  const { loading, error, data } = useObjectives({});

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <div className="mb-4">
        <h1 className="font-bold text-2xl">Acme Inc.</h1>
        <div className="text-dark-2">Sell the best possible boxes</div>
      </div>

      <div className="my-4 py-4">
        <h1 className="font-bold mb-4">Company goals</h1>
        <ListOfObjectives objectives={data.objectives} />
      </div>
    </>
  )
}
