import { IconChevronRight } from "@tabler/icons-react";
import React from "react";
import { GoalPage } from ".";
import { IconGoal } from "../icons";
import { BlackLink } from "../Link";
import { PrivacyIndicator } from "../PrivacyIndicator";
import { StatusBadge } from "../StatusBadge";

export function PageHeader(props: GoalPage.Props) {
  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Goals" },
  ];

  return (
    <div className="mt-4 px-4 flex items-center gap-3">
      <IconGoal size={38} className="rounded-lg bg-red-50 dark:bg-red-900" />

      <div>
        <Breadcrumbs navigation={navigation} />

        <div className="flex items-center gap-2">
          <div className="font-semibold text-lg">{props.goalName}</div>

          <PrivacyIndicator
            resourceType="goal"
            privacyLevel={props.privacyLevel}
            spaceName={props.spaceName}
            className="inline-block ml-3 align-[-2px]"
          />

          <StatusBadge status={props.status} hideIcon className="scale-90 inline-block shrink-0 align-[5px]" />
        </div>
      </div>
    </div>
  );
}

function Breadcrumbs({ navigation }: { navigation: { to: string; label: string }[] }) {
  return (
    <div>
      <nav className="flex items-center space-x-0.5 mt-1">
        {navigation.map((item, index) => (
          <React.Fragment key={index}>
            <BlackLink to={item.to} className="text-xs text-content-dimmed leading-snug" underline="hover">
              {item.label}
            </BlackLink>
            {index < navigation.length - 1 && <IconChevronRight size={10} className="text-content-dimmed" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

// export function PageHeader(props: GoalPage.Props) {
//   return (
//     <div className="border-b border-stroke-base sm:pt-6 pb-4">
//       <ParentGoal {...props} />

//       <div className="sm:flex sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-3xl font-bold inline">{props.goalName}</h1>

//           <PrivacyIndicator
//             resourceType="goal"
//             privacyLevel={props.privacyLevel}
//             spaceName={props.spaceName}
//             className="inline-block ml-3 align-[-2px]"
//           />

//           <StatusBadge status={props.status} hideIcon className="inline-block shrink-0 ml-3 align-[5px]" />
//         </div>

//         <Buttons {...props} />
//       </div>
//     </div>
//   );
// }

// function Buttons(props: GoalPage.Props) {
//   return (
//     <div className="flex items-center gap-2 mt-4 sm:mt-0">
//       {props.canEdit && (
//         <SecondaryButton size="sm" linkTo={props.editGoalLink}>
//           <div className="flex items-center gap-1.5">
//             <IconPencil size="16" /> Edit
//           </div>
//         </SecondaryButton>
//       )}
//       {props.canEdit && (
//         <PrimaryButton size="sm" linkTo={props.newCheckInLink}>
//           Check-In
//         </PrimaryButton>
//       )}
//     </div>
//   );
// }
