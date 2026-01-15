import Api from "@/api";
import { PageModule } from "@/routes/types";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as React from "react";
import { IconAlertTriangle, IconId, IconLink, IconRefresh, IconUserX } from "turboui";

import { CopyToClipboard } from "@/components/CopyToClipboard";
import { BlackLink, Menu, MenuActionItem, MenuLinkItem, PrimaryButton, SecondaryButton } from "turboui";

import Modal, { ModalState, useModalState } from "@/components/Modal";
import { useMe } from "@/contexts/CurrentCompanyContext";
import plurarize from "@/utils/plurarize";
import { createTestId } from "@/utils/testid";
import { Avatar } from "turboui";

import { usePaths } from "@/routes/paths";
export default { name: "CompanyAdminManagePeoplePage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
  invitedPeople: People.Person[];
  currentMembers: People.Person[];
}

async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({ id: params.companyId }).then((res) => res.company);
  const people = await People.getPeople({ includeManager: true, includeInviteLink: true }).then((res) => res.people);

  return {
    company: company,
    invitedPeople: People.sortByName(people?.filter((person) => person.hasOpenInvitation) || []),
    currentMembers: People.sortByName(people?.filter((person) => !person.hasOpenInvitation) || []),
  };
}

function Page() {
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
  const paths = usePaths();
  return <Paper.Navigation items={[{ to: paths.companyAdminPath(), label: "Company Administration" }]} />;
}

function AddMemberButton() {
  const paths = usePaths();
  return (
    <PrimaryButton linkTo={paths.companyManagePeopleAddPeoplePath()} testId="add-person">
      Add Team Member
    </PrimaryButton>
  );
}

function InvitationList() {
  const { invitedPeople } = Pages.useLoadedData() as LoaderResult;
  if (invitedPeople.length === 0) return null;

  return (
    <Paper.Section title="Invitations Awaiting Response">
      <PeopleList people={invitedPeople} />
    </Paper.Section>
  );
}

function MemberList() {
  const { currentMembers } = Pages.useLoadedData() as LoaderResult;
  if (currentMembers.length === 0) return null;

  return (
    <Paper.Section title="Current Team Members">
      <PeopleList people={currentMembers} />
    </Paper.Section>
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
        {People.hasValidInvite(person) && <ExpiresIn inviteLink={person.inviteLink || null} />}

        <PersonActions person={person} />
        <PersonOptions person={person} />
      </div>
    </div>
  );
}

function PersonInfo({ person }: { person: People.Person }) {
  const paths = usePaths();
  return (
    <div>
      <BlackLink to={paths.profilePath(person.id!)} className="font-bold" underline="hover">
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
        <IconAlertTriangle size={20} />
        Invitation Expired
      </div>

      <SecondaryButton size="xs" onClick={modal.show} testId={createTestId("renew-invitation", person.id!)}>
        Renew Invitation
      </SecondaryButton>
    </>
  );
}

function EditProfileButton({ person }: { person: People.Person }) {
  const paths = usePaths();
  return (
    <SecondaryButton
      size="xs"
      linkTo={paths.profileEditPath(person.id!, { from: "admin-manage-people" })}
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
  const viewInvitationModal = useModalState();

  return (
    <>
      <RemovePersonModal person={person} state={removeModal} />
      <ReissueInvitationModal person={person} state={reissueModal} />
       <ViewInvitationModal person={person} state={viewInvitationModal} />

      <Menu testId={testId} size={size}>
        <PersonOptionViewProfile person={person} />
        <PersonOptionViewInvitation person={person} onClick={viewInvitationModal.show} />
        <PersonOptionReissueInvitation person={person} onClick={reissueModal.show} />
        <PersonOptionRemove person={person} onClick={removeModal.show} />
      </Menu>
    </>
  );
}

function PersonOptionViewProfile({ person }: { person: People.Person }) {
  const paths = usePaths();
  return (
    <MenuLinkItem icon={IconId} testId="view-profile" to={paths.profilePath(person.id!)}>
      View Profile
    </MenuLinkItem>
  );
}

function PersonOptionReissueInvitation({ person, onClick }: { person: People.Person; onClick: () => void }) {
  if (!person.hasOpenInvitation) return null;

  return (
    <MenuActionItem icon={IconRefresh} onClick={onClick} testId={createTestId("reissue-token", person.id!)}>
      Re-Issue Invitation
    </MenuActionItem>
  );
}

function PersonOptionViewInvitation({ person, onClick }: { person: People.Person; onClick: () => void }) {
  if (!People.hasValidInvite(person)) return null;

  return (
    <MenuActionItem icon={IconLink} onClick={onClick} testId={createTestId("view-invite-link", person.id!)}>
      View Invitation Link
    </MenuActionItem>
  );
}

function PersonOptionRemove({ person, onClick }: { person: People.Person; onClick: () => void }) {
  const me = useMe();
  if (me!.id === person.id) return null;

  return (
    <MenuActionItem icon={IconUserX} onClick={onClick} danger testId={createTestId("remove-person", person.id!)}>
      {person.hasOpenInvitation ? "Revoke Invitation" : "Deactivate Account"}
    </MenuActionItem>
  );
}

function RemovePersonModal({ person, state }: { person: People.Person; state: ModalState }) {
  const refresh = Pages.useRefresh();
  const [remove, { loading }] = Companies.useRemoveCompanyMember();
  const firstName = People.firstName(person);
  const isInvitation = person.hasOpenInvitation;

  const handleRemoveMember = async () => {
    await remove({ personId: person.id });
    refresh();
  };

  const title = isInvitation ? `Revoke invitation for ${firstName}?` : `Remove ${firstName} from the company?`;

  const message = isInvitation
    ? `This will revoke ${firstName}'s invitation. You can create a new invitation later if needed.`
    : `This will deactivate ${firstName}'s account, restricting access to company resources. You can restore access later if needed.`;

  const buttonText = isInvitation ? "Revoke" : "Deactivate";

  return (
    <Modal title={title} isOpen={state.isOpen} hideModal={state.hide}>
      <div>{message}</div>
      <div className="mt-8 flex gap-2">
        <PrimaryButton onClick={handleRemoveMember} loading={loading} testId="confirm-remove-member" size="sm">
          {buttonText}
        </PrimaryButton>
        <SecondaryButton onClick={state.hide} testId="cancel-remove-member" size="sm">
          Cancel
        </SecondaryButton>
      </div>
    </Modal>
  );
}

function ReissueInvitationModal(props: { person: People.Person; state: ModalState }) {
  const [isGenerated, setGenerated] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [create, { loading }] = Api.invitations.useNewInvitationToken();

  const generate = async () => {
    const res = await create({ personId: props.person.id });
    const result = Companies.createInvitationUrl(res.inviteLink.token);

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

function ViewInvitationModal(props: { person: People.Person; state: ModalState }) {
  const token = props.person.inviteLink?.token;
  if (!token) return null;

  const url = Companies.createInvitationUrl(token);

  return (
    <>
      <Modal title="Invitation URL" isOpen={props.state.isOpen} hideModal={props.state.hide} size="lg">
        <NewInvitationUrl url={url} person={props.person} />
      </Modal>
    </>
  );
}

function RenewInvitationModal(props: { person: People.Person; state: ModalState }) {
  const refresh = Pages.useRefresh();
  const [url, setUrl] = React.useState("");
  const [create] = Api.invitations.useNewInvitationToken();

  React.useEffect(() => {
    create({ personId: props.person.id! }).then((res) => {
      setUrl(Companies.createInvitationUrl(res.inviteLink.token));
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

function ExpiresIn({ inviteLink }: { inviteLink: People.InviteLink | null }) {
  if (!inviteLink) return null;

  const expiresAt = Time.parse(inviteLink.expiresAt);

  if (!expiresAt) return null;

  const diff = +expiresAt - +new Date();
  let humanDuration = "";

  if (diff < 0) {
    throw new Error("Invitation expired");
  }

  if (diff < 60 * 1000) {
    humanDuration = "less than a minute";
  } else if (diff < 60 * 60 * 1000) {
    let value = Math.ceil(diff / (60 * 1000));
    humanDuration = plurarize(value, "minute", "minutes");
  } else if (diff < 24 * 60 * 60 * 1000) {
    let value = Math.ceil(diff / (60 * 60 * 1000));
    humanDuration = plurarize(value, "hour", "hours");
  } else {
    let value = Math.ceil(diff / (24 * 60 * 60 * 1000));
    humanDuration = plurarize(value, "day", "days");
  }

  return <div>Expires in {humanDuration}</div>;
}
