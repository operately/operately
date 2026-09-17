import { PageModule } from "@/routes/types";

import { loader, useLoadedData } from "./loader";
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

function Page() {
  const { company, invitedPeople, currentMembers, guests } = useLoadedData();
  const paths = usePaths();
  const me = useMe()!;
  const { mutateAsync: remove } = Companies.useRemoveCompanyMember();
  const { mutateAsync: createInvite } = Companies.useNewInvitationToken();
  const { mutateAsync: convertToGuest } = Companies.useConvertMemberToGuest();
  const { mutateAsync: editPermissions } = Companies.useUpdateMembersPermissions();

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
    },
    [remove],
  );

  const handleConvertToGuest = React.useCallback(
    async (personId: string) => {
      await convertToGuest({ personId });
    },
    [convertToGuest],
  );

  const handleCreateInvite = React.useCallback(
    async (personId: string) => {
      const res = await createInvite({ personId });
      if (!res.inviteLink?.token) throw new Error("Invitation token is unavailable");
      return Companies.createInvitationUrl(res.inviteLink.token);
    },
    [createInvite],
  );

  const handleChangeAccessLevel = React.useCallback(
    async (personId: string, accessLevel: Permissions.AccessOptions) => {
      await editPermissions({ members: [{ id: personId, accessLevel }] });
    },
    [editPermissions],
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
