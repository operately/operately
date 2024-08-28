import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { Paths } from "@/routes/paths";
import { FilledButton } from "@/components/Button";
import { BlackLink } from "@/components/Link";
import { Menu, MenuItem } from "@/components/Menu";

import Avatar from "@/components/Avatar";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title={["Manage Team Members", company.name!]}>
      <Paper.Root size="large">
        <Navigation />

        <Paper.Body>
          <Header />
          <InvitationList />
          <MemberList />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.companyAdminPath()}>Company Administration</Paper.NavItem>
    </Paper.Navigation>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <Title />
      <AddMemberButton />
    </div>
  );
}

function Title() {
  return (
    <div>
      <div className="text-content-accent text-3xl font-extrabold leading-none">Manage Team Members</div>
      <div className="mt-2">Add new team members, update profiles, or remove access as needed.</div>
    </div>
  );
}

function AddMemberButton() {
  return (
    <FilledButton type="primary" linkTo={Paths.companyManagePeopleAddPeoplePath()} testId="add-person">
      Add Team Member
    </FilledButton>
  );
}

function InvitationList() {
  const { invitedPeople } = useLoadedData();
  if (invitedPeople.length === 0) return null;

  return (
    <div>
      <div className="font-bold text-2xl mb-6 mt-12">Invitations Awaiting Response</div>
      <PeopleList people={invitedPeople} />
    </div>
  );
}

function MemberList() {
  const { currentMembers } = useLoadedData();
  if (currentMembers.length === 0) return null;

  return (
    <div>
      <div className="font-bold text-2xl mb-6 mt-12">Current Team Members</div>
      <PeopleList people={currentMembers} />
    </div>
  );
}

function PeopleList({ people }: { people: People.Person[] }) {
  return (
    <div>
      {people.map((person) => (
        <PersonRow key={person.id!} person={person} />
      ))}
    </div>
  );
}

function PersonRow({ person }: { person: People.Person }) {
  return (
    <div className="flex items-center justify-between border-t border-stroke-dimmed py-4 last:border-b">
      <div className="flex items-center gap-4">
        <Avatar person={person} size={48} />
        <PersonInfo person={person} />
      </div>

      <div className="flex gap-2 items-center">
        {person.hasOpenInvitation && <div className="text-content-dimmed text-sm mr-2">Expires in 6 hours</div>}
        <PersonActions person={person} />
        <PersonOptions person={person} />
      </div>
    </div>
  );
}

function PersonInfo({ person }: { person: People.Person }) {
  return (
    <div>
      <BlackLink to={Paths.profilePath(person.id!)} className="font-bold" underline="hover">
        {person.fullName}
      </BlackLink>

      <div className="text-content-dimmed text-sm">
        <span className="text-sm">{person.title}</span>
        <span className="text-sm"> &middot; </span>
        <span className="break-all mt-0.5">{person.email}</span>
      </div>
    </div>
  );
}

function PersonActions({ person }: { person: People.Person }) {
  return (
    <div>
      <FilledButton linkTo="/" size="xs" type="secondary" testId="edit-profile-link">
        Edit Profile
      </FilledButton>
    </div>
  );
}

function PersonOptions({ person }: { person: People.Person }) {
  return (
    <Menu>
      <MenuItem icon={Icons.IconId} testId="view-profile" linkTo={Paths.profilePath(person.id!)}>
        View Profile
      </MenuItem>

      <MenuItem icon={Icons.IconTrash} testId="remove-person" linkTo={Paths.profilePath(person.id!)} danger>
        Remove
      </MenuItem>
    </Menu>
  );
}
