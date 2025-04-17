import { GoalPage } from ".";
import { Avatar, AvatarPerson } from "../Avatar";
import { Chronometer } from "../Chronometer";

export function Sidebar(props: GoalPage.Props) {
  return (
    <div className="sm:col-span-3 space-y-6 hidden sm:block">
      <div>
        <div className="font-bold mb-2">Timeline</div>

        <Chronometer start={props.startDate} end={props.endDate} color="stone" />
      </div>

      <div className="space-y-3">
        <div className="font-bold">Team</div>

        {props.champion && <Contributor person={props.champion} description="Champion" />}
        {props.reviewer && <Contributor person={props.reviewer} description="Reviewer" />}
      </div>

      {props.contributors.length > 0 && (
        <div className="space-y-3">
          <div className="font-bold">Contributors</div>

          {props.contributors!.map((c) => (
            <Contributor person={c.person} description={c.role} />
          ))}
        </div>
      )}
    </div>
  );
}

function Contributor({ person, description }: { person: AvatarPerson; description: string }) {
  return (
    <div className="flex items-start gap-2 truncate">
      <Avatar person={person} size={32} />

      <div className="-mt-0.5 truncate">
        <div className="text-sm font-medium">{person.fullName}</div>
        <div className="text-xs truncate">{description}</div>
      </div>
    </div>
  );
}
