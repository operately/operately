import * as React from "react";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";

import { useLoadedData } from "./loader";
import { FilledButton } from "@/components/Button";
import { DivLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function PeopleList() {
  const { company } = useLoadedData();

  return (
    <div>
      <InvitationList people={invitations(company)} />
      <MemberList company={company} people={regularMembers(company)} />
    </div>
  );
}

function invitations(company: Companies.Company) {
  return company.people!.filter((person) => person!.hasOpenInvitation);
}

function regularMembers(company: Companies.Company) {
  return company.people!.filter((person) => !person!.hasOpenInvitation);
}

function InvitationList({ people }: { people: People.Person[] }) {
  return (
    <div>
      <div className="font-bold text-2xl mb-6 mt-12">Pending Invitations</div>

      <div>
        {people.map((person) => (
          <MemberRow key={person!.id} person={person!} />
        ))}
      </div>
    </div>
  );
}

function MemberList({ company, people }: { company: Companies.Company; people: People.Person[] }) {
  return (
    <div>
      <div className="font-bold text-2xl mb-6 mt-12">{company.name} Members</div>

      <div>
        {people.map((person) => (
          <MemberRow key={person.id} person={person} />
        ))}
      </div>
    </div>
  );
}

function MemberRow({ person }: { person: People.Person }) {
  return (
    <div className="flex items-center justify-between border-t border-stroke-dimmed py-4 last:border-b">
      <div className="flex items-center gap-4">
        <Avatar person={person} size={48} />

        <div>
          <DivLink to={Paths.profilePath(person.id!)} className="text-content-primary font-bold hover:underline">
            {person.fullName}
          </DivLink>

          <div className="text-content-dimmed text-sm">
            <span className="text-sm">{person.title}</span>
            <span className="text-sm"> &middot; </span>
            <span className="break-all mt-0.5">{person.email}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <FilledButton linkTo="/" size="xs" type="secondary" testId="edit-profile-link">
          Edit Profile
        </FilledButton>

        <Options person={person} />
      </div>
    </div>
  );
}

function Options({ person }: { person: People.Person }) {
  return (
    <PageOptions.Root testId="person-options" noBorder>
      <PageOptions.Link
        to={Paths.profilePath(person.id!)}
        icon={Icons.IconTrash}
        title="Remove"
        testId="remove-person"
      />
    </PageOptions.Root>
  );
}
