import { Avatar } from "../Avatar";
import { SecondaryButton } from "../Button";
import { Link } from "../Link";
import { formatDateWithDaySuffix } from "../utils/date";
import { truncate } from "../utils/strings";
import { GoalPage } from ".";
import { SectionHeader } from "./SectionHeader";

export function CheckIns(props: GoalPage.Props) {
  if (props.checkIns.length === 0) return null;

  return (
    <div>
      <SectionHeader
        title="Check-Ins"
        buttons={<SecondaryButton size="xxs">Check-In</SecondaryButton>}
        showButtons={props.canEdit}
      />

      <div className="space-y-4 mt-4">
        {props.checkIns.map((checkIn) => (
          <div key={checkIn.id} className="flex flex-row items-start gap-3">
            <Avatar person={checkIn.author} size={36} />
            <div className="flex-1">
              <div className="text-sm -mt-px">
                <Link to={checkIn.link} className="hover:underline font-semibold">
                  {formatDateWithDaySuffix(checkIn.date)}
                </Link>
                {" — "}
                {truncate(checkIn.content, 150)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
