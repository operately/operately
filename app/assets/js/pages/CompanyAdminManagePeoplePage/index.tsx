import Api from "@/api";
import { PageModule } from "@/routes/types";

import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as Permissions from "@/models/permissions";
import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as React from "react";

import { useMe } from "@/contexts/CurrentCompanyContext";
import plurarize from "@/utils/plurarize";
import { usePaths } from "@/routes/paths";
import { CompanyAdminManagePeoplePage } from "turboui";

export default { name: "CompanyAdminManagePeoplePage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
  invitedPeople: People.Person[];
  currentMembers: People.Person[];
  guests: People.Person[];
}

async function loader({ params }): Promise<LoaderResult> {
  const company = await Companies.getCompany({ id: params.companyId, includePermissions: true }).then((res) => res.company);
  const people = await People.getPeople({ includeManager: true, includeCompanyAccessLevels: true, includeInviteLink: true, includeAccount: true }).then(
    (res) => res.people,
  );
  const { invitedPeople, currentMembers, guests } = People.separatePeople(people);

  if (!company.permissions?.isAdmin) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    company: company,
    invitedPeople: People.sortByName(invitedPeople),
    currentMembers: People.sortByName(currentMembers),
    guests: People.sortByName(guests),
  };
}

function Page() {
  const { company, invitedPeople, currentMembers, guests } = Pages.useLoadedData() as LoaderResult;
  const paths = usePaths();
  const me = useMe()!;
  const refresh = Pages.useRefresh();
  const [remove] = Companies.useRemoveCompanyMember();
  const [createInvite] = Api.invitations.useNewInvitationToken();
  const [convertToGuest] = Api.useConvertCompanyMemberToGuest();
  const [editPermissions] = Api.useEditCompanyMembersPermissions();

  const buildPerson = React.useCallback(
    (person: People.Person): CompanyAdminManagePeoplePage.Person => {
      const hasValidInvite = People.hasValidInvite(person);
      const invitationExpired = People.hasInvitationExpired(person);
      const inviteToken = person.inviteLink?.token;

      return {
        id: person.id!,
        fullName: person.fullName || "",
        title: person.title || "",
        email: person.email,
        avatarUrl: person.avatarUrl || null,
        hasOpenInvitation: !!person.hasOpenInvitation,
        hasValidInvite,
        invitationExpired,
        expiresIn: hasValidInvite ? buildExpiresIn(person.inviteLink || null) : null,
        profilePath: paths.profilePath(person.id!),
        profileEditPath: paths.profileEditPath(person.id!, { from: "admin-manage-people" }),
        inviteLinkUrl: inviteToken ? Companies.createInvitationUrl(inviteToken) : null,
        canRemove: me.id !== person.id,
        accessLevel: person.accessLevel || undefined,
      };
    },
    [me.id, paths],
  );

  const invited = React.useMemo(() => invitedPeople.map(buildPerson), [invitedPeople, buildPerson]);
  const members = React.useMemo(() => currentMembers.map(buildPerson), [currentMembers, buildPerson]);
  const collaborators = React.useMemo(() => guests.map(buildPerson), [guests, buildPerson]);

  const handleRemove = React.useCallback(
    async (personId: string) => {
      await remove({ personId });
      refresh();
    },
    [remove, refresh],
  );

  const handleConvertToGuest = React.useCallback(
    async (personId: string) => {
      await convertToGuest({ personId });
      refresh();
    },
    [convertToGuest, refresh],
  );

  const handleCreateInvite = React.useCallback(
    async (personId: string) => {
      const res = await createInvite({ personId });
      return Companies.createInvitationUrl(res.inviteLink.token);
    },
    [createInvite],
  );

  const handleChangeAccessLevel = React.useCallback(
    async (personId: string, accessLevel: Permissions.AccessOptions) => {
      await editPermissions({ members: [{ id: personId, accessLevel }] });
      refresh();
    },
    [editPermissions, refresh],
  );

  const navigationItems = React.useMemo(
    () => [{ to: paths.companyAdminPath(), label: "Company Administration" }],
    [paths],
  );

  return (
    <CompanyAdminManagePeoplePage
      companyName={company?.name || ""}
      navigationItems={navigationItems}
      addMemberPath={paths.invitePeoplePath()}
      invitedPeople={invited}
      currentMembers={members}
      outsideCollaborators={collaborators}
      onRemovePerson={handleRemove}
      onConvertToGuest={handleConvertToGuest}
      onReissueInvitation={handleCreateInvite}
      onRenewInvitation={handleCreateInvite}
      onChangeAccessLevel={handleChangeAccessLevel}
      onRenewModalClose={refresh}
      testId="manage-people-page"
      permissions={company.permissions || {}}
    />
  );
}

function buildExpiresIn(inviteLink: People.InviteLink | null): string | null {
  if (!inviteLink?.expiresAt) return null;

  const expiresAt = Time.parse(inviteLink.expiresAt);
  if (!expiresAt) return null;

  const diff = +expiresAt - +new Date();
  if (diff < 0) return null;

  if (diff < 60 * 1000) {
    return "less than a minute";
  }

  if (diff < 60 * 60 * 1000) {
    const value = Math.ceil(diff / (60 * 1000));
    return plurarize(value, "minute", "minutes");
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const value = Math.ceil(diff / (60 * 60 * 1000));
    return plurarize(value, "hour", "hours");
  }

  const value = Math.ceil(diff / (24 * 60 * 60 * 1000));
  return plurarize(value, "day", "days");
}
