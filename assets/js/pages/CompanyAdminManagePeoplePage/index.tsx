import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as Icons from "@tabler/icons-react";
import * as Companies from "@/models/companies";
import * as Invitations from "@/models/invitations";
import * as Time from "@/utils/time";

import { Paths } from "@/routes/paths";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { BlackLink } from "@/components/Link";
import { Menu, MenuLinkItem, MenuActionItem } from "@/components/Menu";
import { CopyToClipboard } from "@/components/CopyToClipboard";

import Avatar from "@/components/Avatar";
import Modal, { ModalState, useModalState } from "@/components/Modal";
import { createTestId } from "@/utils/testid";
import { useMe } from "@/contexts/CurrentUserContext";

interface LoaderResult {
  company: Companies.Company;
  invitedPeople: People.Person[];
  currentMembers: People.Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({ id: params.companyId }).then((res) => res.company!);
  const people = await People.getPeople({ includeManager: true, includeInvitations: true }).then((res) => res.people!);

  return {
    company: company,
    invitedPeople: People.sortByName(people!.filter((person) => person!.hasOpenInvitation)),
    currentMembers: People.sortByName(people!.filter((person) => !person!.hasOpenInvitation)),
  };
}

export function Page() {
  const { company } = Pages.useLoadedData() as LoaderResult;

  return (
    <Pages.Page title={["Manage Team Members", company.name!]} testId="manage-people-page">
      <Paper.Root size="large">
        <Navigation />

        <Paper.Body>
          <Paper.Header
            title="Manage Team Members"
            subtitle="Add new team members, update profiles, or remove access as needed."
            actions={<AddMemberButton />}
          />

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

function AddMemberButton() {
  return (
    <PrimaryButton linkTo={Paths.companyManagePeopleAddPeoplePath()} testId="add-person">
      Add Team Member
    </PrimaryButton>
  );
}

function InvitationList() {
  const { invitedPeople } = Pages.useLoadedData() as LoaderResult;
  if (invitedPeople.length === 0) return null;

  return (
    <div>
      <div className="font-bold text-2xl mb-6 mt-12">Invitations Awaiting Response</div>
      <PeopleList people={invitedPeople} />
    </div>
  );
}

function MemberList() {
  const { currentMembers } = Pages.useLoadedData() as LoaderResult;
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
        {People.hasValidInvite(person) && <ExpiresIn invitation={person.invitation!} />}

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
    <div className="flex items-center gap-4">
      {People.hasInvitationExpired(person) ? (
        <ExpiredInvitationAndRenewButton person={person} />
      ) : (
        <EditProfileButton person={person} />
      )}
    </div>
  );
}

function ExpiredInvitationAndRenewButton({ person }: { person: People.Person }) {
  const modal = useModalState();

  return (
    <>
      <RenewInvitationModal person={person} state={modal} />

      <div className="text-content-error font-semibold flex items-center gap-2">
        <Icons.IconAlertTriangle size={20} />
        Invitation Expired
      </div>

      <SecondaryButton size="xs" onClick={modal.show} testId={createTestId("renew-invitation", person.id!)}>
        Renew Invitation
      </SecondaryButton>
    </>
  );
}

function EditProfileButton({ person }: { person: People.Person }) {
  return (
    <SecondaryButton
      size="xs"
      linkTo={Paths.profileEditPath(person.id!, { from: "admin-manage-people" })}
      testId={createTestId("edit", person.id!)}
    >
      Edit Profile
    </SecondaryButton>
  );
}

function PersonOptions({ person }: { person: People.Person }) {
  const testId = createTestId("person-options", person.id!);
  const size = person.hasOpenInvitation ? "medium" : "small";

  const removeModal = useModalState();
  const reissueModal = useModalState();

  return (
    <>
      <RemovePersonModal person={person} state={removeModal} />
      <ReissueInvitationModal person={person} state={reissueModal} />

      <Menu testId={testId} size={size}>
        <PersonOptionViewProfile person={person} />
        <PersonOptionReissueInvitation person={person} onClick={reissueModal.show} />
        <PersonOptionRemove person={person} onClick={removeModal.show} />
      </Menu>
    </>
  );
}

function PersonOptionViewProfile({ person }: { person: People.Person }) {
  return (
    <MenuLinkItem icon={Icons.IconId} testId="view-profile" to={Paths.profilePath(person.id!)}>
      View Profile
    </MenuLinkItem>
  );
}

function PersonOptionReissueInvitation({ person, onClick }: { person: People.Person; onClick: () => void }) {
  if (!person.hasOpenInvitation) return null;

  return (
    <MenuActionItem icon={Icons.IconRefresh} onClick={onClick} testId={createTestId("reissue-token", person.id!)}>
      Re-Issue Invitation
    </MenuActionItem>
  );
}

function PersonOptionRemove({ person, onClick }: { person: People.Person; onClick: () => void }) {
  const me = useMe();
  if (me!.id === person.id) return null;

  return (
    <MenuActionItem icon={Icons.IconTrash} onClick={onClick} danger testId={createTestId("remove-person", person.id!)}>
      Remove
    </MenuActionItem>
  );
}

function RemovePersonModal({ person, state }: { person: People.Person; state: ModalState }) {
  const refresh = Pages.useRefresh();
  const [remove, { loading }] = Companies.useRemoveCompanyMember();

  const handleRemoveMember = async () => {
    await remove({ personId: person.id });
    refresh();
  };

  return (
    <Modal title="Remove Company Member" isOpen={state.isOpen} hideModal={state.hide}>
      <div>Are you sure you want to remove {person.fullName} from the company?</div>
      <div className="mt-8 flex justify-center">
        <PrimaryButton onClick={handleRemoveMember} loading={loading} testId="confirm-remove-member" size="sm">
          Remove Member
        </PrimaryButton>
      </div>
    </Modal>
  );
}

function ReissueInvitationModal(props: { person: People.Person; state: ModalState }) {
  const [isGenerated, setGenerated] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [create, { loading }] = Companies.useNewInvitationToken();

  const generate = async () => {
    const res = await create({ personId: props.person.id! });
    const result = Companies.createInvitationUrl(res.invitation!.token!);

    setUrl(result);
    setGenerated(true);
  };

  return (
    <>
      <Modal title="Re-generate the invitation URL" isOpen={props.state.isOpen} hideModal={props.state.hide} size="lg">
        <div>
          By clicking the button below:
          <ul className="list-disc list-inside mt-2 block">
            <li>A new invitation URL will be generated for {props.person.fullName}.</li>
            <li>The previous URL will no longer be valid.</li>
          </ul>
        </div>

        {!isGenerated && <NewInvitationButton onClick={generate} loading={loading} />}
        {isGenerated && <NewInvitationUrl url={url} person={props.person} />}
      </Modal>
    </>
  );
}

function RenewInvitationModal(props: { person: People.Person; state: ModalState }) {
  const refresh = Pages.useRefresh();
  const [url, setUrl] = React.useState("");
  const [create] = Companies.useNewInvitationToken();

  React.useEffect(() => {
    create({ personId: props.person.id! }).then((res) => {
      setUrl(Companies.createInvitationUrl(res.invitation!.token!));
    });
  }, []);

  return (
    <>
      <Modal title="New invitation URL" isOpen={props.state.isOpen} hideModal={refresh} size="lg">
        <NewInvitationUrl url={url} person={props.person} />
      </Modal>
    </>
  );
}

function NewInvitationButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div className="flex items-center mt-4">
      <PrimaryButton onClick={onClick} loading={loading} testId="confirm-reissue">
        I understand, Create New Invitation
      </PrimaryButton>
    </div>
  );
}

function NewInvitationUrl({ url, person }: { url: string; person: People.Person }) {
  return (
    <>
      <div className="mt-4">Share this URL with {person.fullName} to invite them to the company:</div>
      <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between mt-2">
        <span className="break-all">{url}</span>
        <CopyToClipboard text={url} size={25} padding={1} containerClass="" />
      </div>
    </>
  );
}

function ExpiresIn({ invitation }: { invitation: Invitations.Invitation }) {
  const expiresAt = Time.parse(invitation.expiresAt);
  if (!expiresAt) return null;

  const diff = +expiresAt - +new Date();
  let humanDuration = "";

  if (diff < 0) {
    throw new Error("Invitation expired");
  }

  if (diff < 60 * 1000) {
    humanDuration = "less than a minute";
  }

  if (diff < 60 * 60 * 1000) {
    let value = Math.ceil(diff / (60 * 1000));
    humanDuration = value === 1 ? "1 minute" : value + " minutes";
  }

  if (diff < 24 * 60 * 60 * 1000) {
    let value = Math.ceil(diff / (60 * 60 * 1000));
    humanDuration = value === 1 ? "1 hour" : value + " hours";
  }

  return <div>Expires in {humanDuration}</div>;
}
