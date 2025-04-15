import { GoalPage } from ".";
import { AvatarList, AvatarWithName } from "../Avatar";
import { Chronometer } from "../Chronometer";

export function Sidebar(props: GoalPage.Props) {
  return (
    <div className="col-span-3 space-y-6">
      <Timeframe {...props} />
      <Champion {...props} />
      <Reviewer {...props} />
      <Contributors {...props} />
    </div>
  );
}

export function Timeframe(props: GoalPage.Props) {
  return (
    <div>
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Timeline</div>
      <Chronometer start={props.startDate} end={props.endDate} color="stone" />
    </div>
  );
}

export function Champion(props: GoalPage.Props) {
  if (!props.champion) return null;

  return (
    <div className="mb-4">
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Champion</div>
      <AvatarWithName person={props.champion} size={24} className="text-sm text-gray-900" />
    </div>
  );
}

export function Reviewer(props: GoalPage.Props) {
  if (!props.reviewer) return null;

  return (
    <div>
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Reviewer</div>
      <AvatarWithName person={props.reviewer} size={24} className="text-sm text-gray-900" />
    </div>
  );
}

export function Contributors(props: GoalPage.Props) {
  if (!props.contributors || props.contributors.length === 0) return null;

  return (
    <div>
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Contributors</div>
      <div className="mb-2">
        <AvatarList people={props.contributors} size={24} maxElements={30} />
      </div>
      <div className="text-xs text-gray-600">
        {props.contributors.length} {props.contributors.length === 1 ? "person" : "people"} contributed by working on
        related projects and sub-goals
      </div>
    </div>
  );
}