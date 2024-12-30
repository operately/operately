import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";
import AvatarList from "@/components/AvatarList";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"DesignAvatarsPage"}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo="/__design__">Lobby</Paper.NavItem>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo="/__design__">Design System</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Paper.Header title="Avatars" />

          <div className="mb-8">
            <p className="mt-2">
              Operately uses full-rounded avatar images for user profiles. The avatar image is used to represent a user.
              If the user does not have an avatar image, the user's initials are displayed in a circle. The initials are
              generated from the user's name.
            </p>
          </div>

          <h3 className="font-bold mt-8">Avatar sizes</h3>
          <p className="mb-4">There are five sizes of avatars: xxlarge, xlarge, large, small, and tiny.</p>

          <div className="flex items-top space-x-10">
            <div className="flex flex-col items-center gap-2">
              <div className="text-sm">XXLarge</div>
              <div className="flex items-center gap-2">
                <Avatar person={EXAMPLE_PEOPLE[0]!} size="xxlarge" />
                <Avatar person={EXAMPLE_PEOPLE[1]!} size="xxlarge" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-sm">XLarge</div>

              <div className="flex items-center gap-2">
                <Avatar person={EXAMPLE_PEOPLE[0]!} size="xlarge" />
                <Avatar person={EXAMPLE_PEOPLE[1]!} size="xlarge" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-sm">Large</div>

              <div className="flex items-center gap-2">
                <Avatar person={EXAMPLE_PEOPLE[0]!} size="large" />
                <Avatar person={EXAMPLE_PEOPLE[1]!} size="large" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-sm">Small</div>

              <div className="flex items-center gap-2">
                <Avatar person={EXAMPLE_PEOPLE[0]!} size="small" />
                <Avatar person={EXAMPLE_PEOPLE[1]!} size="small" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-sm">Tiny</div>
              <div className="flex items-center gap-2">
                <Avatar person={EXAMPLE_PEOPLE[0]!} size="tiny" />
                <Avatar person={EXAMPLE_PEOPLE[1]!} size="tiny" />
              </div>
            </div>
          </div>

          <h3 className="font-bold mt-8">Avatar lists</h3>
          <p className="mb-4">Avatars can be displayed in a list.</p>

          <div className="flex items-center gap-2 border-t border-stroke-base py-3">
            <div className="w-48 font-medium shrink-0">With gaps</div>
            <AvatarList people={EXAMPLE_PEOPLE} size="small" maxElements={300} />
          </div>

          <div className="flex items-center gap-2 border-t border-stroke-base py-3">
            <div className="w-48 font-medium shrink-0">Stacked</div>
            <AvatarList people={EXAMPLE_PEOPLE} size="small" stacked maxElements={300} />
          </div>

          <div className="flex items-center gap-2 border-t border-stroke-base py-3">
            <div className="w-48 font-medium shrink-0">Max Elements</div>
            <AvatarList people={EXAMPLE_PEOPLE} size="small" maxElements={5} stacked />
          </div>

          <div className="flex items-center gap-2 border-t border-stroke-base py-3">
            <div className="w-48 font-medium shrink-0">No cut-off indicator</div>
            <AvatarList people={EXAMPLE_PEOPLE} size="small" maxElements={5} stacked showCutOff={false} />
          </div>

          <div className="flex items-center gap-2 border-y border-stroke-base py-3">
            <div className="w-48 font-medium shrink-0">Tiny</div>
            <AvatarList people={EXAMPLE_PEOPLE} size="tiny" maxElements={15} stacked />
          </div>

          <div className="flex items-center gap-2 border-y border-stroke-base py-3">
            <div className="w-48 font-medium shrink-0">XLarge</div>
            <AvatarList people={EXAMPLE_PEOPLE} size="xlarge" maxElements={5} stacked />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function genAvatar(id: string) {
  return `https://images.unsplash.com/${id}?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80`;
}

const EXAMPLE_PEOPLE = [
  {
    id: "bob_williams",
    fullName: "Bob Williams",
    title: "Chief Operating Officer (COO)",
    avatarUrl: genAvatar("photo-1500648767791-00dcc994a43e"),
  },
  {
    id: "charlie_davis",
    fullName: "Martin Smith",
    title: "Chief Financial Officer (CFO)",
    avatarUrl: genAvatar("photo-1472099645785-5658abf4ff4e"),
  },
  {
    id: "david_brown",
    fullName: "David Brown",
    title: "Chief Technology Officer (CTO)",
    avatarUrl: genAvatar("photo-1491528323818-fdd1faba62cc"),
  },
  {
    id: "emily_davis",
    fullName: "Emily Davis",
    title: "Chief Marketing Officer (CMO)",
    avatarUrl: genAvatar("photo-1438761681033-6461ffad8d80"),
  },
  {
    id: "frank_miller",
    fullName: "Frank Miller",
    title: "VP of Product",
    avatarUrl: genAvatar("photo-1633332755192-727a05c4013d"),
  },
  {
    id: "grace_wilson",
    fullName: "Grace Wilson",
    title: "VP of Compliance",
    avatarUrl: genAvatar("photo-1494790108377-be9c29b29330"),
  },
  {
    id: "henry_taylor",
    fullName: "Henry Taylor",
    title: "VP of Engineering",
    avatarUrl: genAvatar("photo-1492562080023-ab3db95bfbce"),
  },
  {
    id: "ivy_anderson",
    fullName: "Ivy Anderson",
    title: "VP of Sales",
    avatarUrl: genAvatar("photo-1522075469751-3a6694fb2f61"),
  },
  {
    id: "jack_thomas",
    fullName: "Jack Thomas",
    title: "VP of Customer Success",
    avatarUrl: genAvatar("photo-1579038773867-044c48829161"),
  },
  {
    id: "karen_martinez",
    fullName: "Karen Martinez",
    title: "VP of Human Resources",
    avatarUrl: genAvatar("photo-1534528741775-53994a69daeb"),
  },
  {
    id: "liam_harris",
    fullName: "Liam Harris",
    title: "VP of Design",
    avatarUrl: genAvatar("photo-1489980557514-251d61e3eeb6"),
  },
  {
    id: "mia_clark",
    fullName: "Mia Clark",
    title: "Director of Engineering",
    avatarUrl: genAvatar("photo-1541823709867-1b206113eafd"),
  },
  {
    id: "nathan_morris",
    fullName: "Noah Lewis",
    title: "Director of Sales",
    avatarUrl: genAvatar("photo-1568602471122-7832951cc4c5"),
  },
  {
    id: "olivia_hall",
    fullName: "Olivia Hall",
    title: "Product Manager",
    avatarUrl: genAvatar("photo-1531123897727-8f129e1688ce"),
  },
  {
    id: "paul_young",
    fullName: "Paul Young",
    title: "Director of Business Development",
    avatarUrl: genAvatar("photo-1600180758890-6b94519a8ba6"),
  },
  {
    id: "quinn_walker",
    fullName: "Quinn Walker",
    title: "Director of Operations",
    avatarUrl: genAvatar("photo-1584999734482-0361aecad844"),
  },
  {
    id: "rachel_king",
    fullName: "Rachel King",
    title: "Director of Marketing",
    avatarUrl: genAvatar("photo-1502031882019-24c0bccfffc6"),
  },
  {
    id: "tina_scott",
    fullName: "Tina Scott",
    title: "Customer Support Representative",
    avatarUrl: genAvatar("photo-1700248356502-ca48ae3bafd6"),
  },
  {
    id: "walter_baker",
    fullName: "Walter Baker",
    title: "Lead Software Engineer",
    avatarUrl: genAvatar("photo-1521341957697-b93449760f30"),
  },
];

export function Avatars() {
  return <></>;
}
