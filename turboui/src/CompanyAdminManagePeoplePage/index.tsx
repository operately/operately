import React from "react";

import { PrimaryButton } from "../Button";
import { Navigation } from "../Page/Navigation";
import { useHtmlTitle } from "../Page/useHtmlTitle";
import classNames from "../utils/classnames";
import { ConvertToGuestModal } from "./components/ConvertToGuestModal";
import { PeopleList } from "./components/PeopleList";
import { ReissueInvitationModal } from "./components/ReissueInvitationModal";
import { RemovePersonModal } from "./components/RemovePersonModal";
import { InvitationUrl } from "./components/InvitationUrl";
import { LegacyModal } from "./components/LegacyModal";
import type { CompanyAdminManagePeoplePageProps, CompanyAdminManagePerson } from "./types";
import { useWindowSizeBreakpoints } from "../utils/useWindowSizeBreakpoint";

export namespace CompanyAdminManagePeoplePage {
  export type Person = CompanyAdminManagePerson;
  export type Props = CompanyAdminManagePeoplePageProps;
}

type ActiveModal =
  | { type: "remove"; person: CompanyAdminManagePeoplePage.Person }
  | { type: "convert"; person: CompanyAdminManagePeoplePage.Person }
  | { type: "reissue"; person: CompanyAdminManagePeoplePage.Person }
  | { type: "view"; person: CompanyAdminManagePeoplePage.Person }
  | { type: "renew"; person: CompanyAdminManagePeoplePage.Person };

const defaultReissueState = { inviteUrl: "", isGenerated: false, loading: false };
const defaultRenewState = { inviteUrl: "", loading: false };

export function CompanyAdminManagePeoplePage(props: CompanyAdminManagePeoplePage.Props) {
  const windowSize = useWindowSizeBreakpoints();
  const pageTitle = ["Manage Team Members", props.companyName];
  useHtmlTitle(pageTitle);
  const outsideCollaborators = props.outsideCollaborators ?? [];
  const showOutsideCollaborators = outsideCollaborators.length > 0;

  const [activeModal, setActiveModal] = React.useState<ActiveModal | null>(null);
  const [removeLoading, setRemoveLoading] = React.useState(false);
  const [convertLoading, setConvertLoading] = React.useState(false);
  const [reissueState, setReissueState] = React.useState(defaultReissueState);
  const [renewState, setRenewState] = React.useState(defaultRenewState);

  const closeModal = React.useCallback(() => {
    if (activeModal?.type === "renew") {
      props.onRenewModalClose?.();
    }

    setActiveModal(null);
    setRemoveLoading(false);
    setConvertLoading(false);
    setReissueState(defaultReissueState);
    setRenewState(defaultRenewState);
  }, [activeModal?.type, props.onRenewModalClose]);

  const openRemoveModal = React.useCallback((person: CompanyAdminManagePeoplePage.Person) => {
    setActiveModal({ type: "remove", person });
    setRemoveLoading(false);
  }, []);

  const openConvertModal = React.useCallback((person: CompanyAdminManagePeoplePage.Person) => {
    setActiveModal({ type: "convert", person });
    setConvertLoading(false);
  }, []);

  const openReissueModal = React.useCallback((person: CompanyAdminManagePeoplePage.Person) => {
    setActiveModal({ type: "reissue", person });
    setReissueState(defaultReissueState);
  }, []);

  const openViewModal = React.useCallback((person: CompanyAdminManagePeoplePage.Person) => {
    setActiveModal({ type: "view", person });
  }, []);

  const openRenewModal = React.useCallback((person: CompanyAdminManagePeoplePage.Person) => {
    setActiveModal({ type: "renew", person });
    setRenewState(defaultRenewState);
  }, []);

  const handleRemove = React.useCallback(async () => {
    if (!activeModal || activeModal.type !== "remove") return;
    if (removeLoading) return;

    setRemoveLoading(true);
    try {
      await props.onRemovePerson(activeModal.person.id);
      closeModal();
    } finally {
      setRemoveLoading(false);
    }
  }, [activeModal, closeModal, props.onRemovePerson, removeLoading]);

  const handleConvert = React.useCallback(async () => {
    if (!activeModal || activeModal.type !== "convert") return;
    if (convertLoading) return;

    setConvertLoading(true);
    try {
      await props.onConvertToGuest(activeModal.person.id);
      closeModal();
    } finally {
      setConvertLoading(false);
    }
  }, [activeModal, closeModal, convertLoading, props.onConvertToGuest]);

  const handleGenerateReissue = React.useCallback(async () => {
    if (!activeModal || activeModal.type !== "reissue") return;
    if (reissueState.loading) return;

    setReissueState((prev) => ({ ...prev, loading: true }));
    try {
      const url = await props.onReissueInvitation(activeModal.person.id);
      setReissueState({ inviteUrl: url, isGenerated: true, loading: false });
    } catch {
      setReissueState((prev) => ({ ...prev, loading: false }));
    }
  }, [activeModal, props.onReissueInvitation, reissueState.loading]);

  React.useEffect(() => {
    if (!activeModal || activeModal.type !== "renew") return;
    if (renewState.loading || renewState.inviteUrl) return;

    setRenewState({ inviteUrl: "", loading: true });

    props
      .onRenewInvitation(activeModal.person.id)
      .then((url) => {
        setRenewState({ inviteUrl: url, loading: false });
      })
      .catch(() => {
        setRenewState({ inviteUrl: "", loading: false });
      });
  }, [activeModal, props.onRenewInvitation, renewState.inviteUrl, renewState.loading]);

  return (
    <div
      className="mx-auto relative sm:my-10 sm:max-w-[100%] lg:max-w-5xl"
      data-test-id={props.testId ?? "manage-people-page"}
    >
      <Navigation items={props.navigationItems} />

      <div className="relative bg-surface-base min-h-dvh sm:min-h-0 sm:border sm:border-surface-outline sm:rounded-lg sm:shadow-xl">
        <div className="px-4 lg:px-12 py-10">
          <PageHeader
            title="Manage Team Members"
            subtitle="Add new team members, update profiles, or remove access as needed."
            actions={
              <PrimaryButton linkTo={props.addMemberPath} testId="add-person" className="whitespace-nowrap" size={windowSize === "xs" ? "sm" : "base"}>
                Invite people
              </PrimaryButton>
            }
          />

          {props.invitedPeople.length > 0 && (
            <Section title="Invitations Awaiting Response">
              <PeopleList
                people={props.invitedPeople}
                testId="invited-people-list"
                onOpenRemove={openRemoveModal}
                onOpenConvert={openConvertModal}
                onOpenReissue={openReissueModal}
                onOpenView={openViewModal}
                onOpenRenew={openRenewModal}
                onChangeAccessLevel={props.onChangeAccessLevel}
                permissions={props.permissions}
                showConvertToGuest
                showAccessLevelOptions
              />
            </Section>
          )}

          {props.currentMembers.length > 0 && (
            <Section title="Current Team Members">
              <PeopleList
                people={props.currentMembers}
                testId="current-members-list"
                onOpenRemove={openRemoveModal}
                onOpenConvert={openConvertModal}
                onOpenReissue={openReissueModal}
                onOpenView={openViewModal}
                onOpenRenew={openRenewModal}
                onChangeAccessLevel={props.onChangeAccessLevel}
                permissions={props.permissions}
                showConvertToGuest
                showAccessLevelOptions
              />
            </Section>
          )}

          {showOutsideCollaborators && (
            <Section title="Outside collaborators">
              <PeopleList
                people={outsideCollaborators}
                testId="outside-collaborators-list"
                onOpenRemove={openRemoveModal}
                onOpenConvert={openConvertModal}
                onOpenReissue={openReissueModal}
                onOpenView={openViewModal}
                onOpenRenew={openRenewModal}
                onChangeAccessLevel={props.onChangeAccessLevel}
                permissions={props.permissions}
              />
            </Section>
          )}
        </div>
      </div>

      <RemovePersonModal
        isOpen={activeModal?.type === "remove"}
        person={activeModal?.type === "remove" ? activeModal.person : null}
        onClose={closeModal}
        onConfirm={handleRemove}
        loading={removeLoading}
      />

      <ConvertToGuestModal
        isOpen={activeModal?.type === "convert"}
        person={activeModal?.type === "convert" ? activeModal.person : null}
        onClose={closeModal}
        onConfirm={handleConvert}
        loading={convertLoading}
      />

      <ReissueInvitationModal
        isOpen={activeModal?.type === "reissue"}
        person={activeModal?.type === "reissue" ? activeModal.person : null}
        onClose={closeModal}
        onGenerate={handleGenerateReissue}
        inviteUrl={reissueState.inviteUrl}
        isGenerated={reissueState.isGenerated}
        loading={reissueState.loading}
      />

      <ViewInvitationModal
        isOpen={activeModal?.type === "view"}
        person={activeModal?.type === "view" ? activeModal.person : null}
        onClose={closeModal}
      />

      <RenewInvitationModal
        isOpen={activeModal?.type === "renew"}
        person={activeModal?.type === "renew" ? activeModal.person : null}
        onClose={closeModal}
        inviteUrl={renewState.inviteUrl}
      />
    </div>
  );
}

function Section({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const className = classNames("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0", {
    "mb-6": subtitle,
    "mb-2": !subtitle,
  });

  return (
    <div className="mt-10">
      <div className={className}>
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle && <p className="text-sm max-w-xl">{subtitle}</p>}
        </div>

        {actions && <div className="w-full sm:w-auto">{actions}</div>}
      </div>

      {children}
    </div>
  );
}

function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] sm:flex items-center justify-between mb-6">
      <div>
        <div className="text-content-accent text-lg md:text-2xl font-extrabold">{title}</div>
        {subtitle && <div className="mt-2 sm:block hidden">{subtitle}</div>}
      </div>
      <div>{actions}</div>

      {subtitle && <div className="mt-2 col-span-2 sm:hidden block">{subtitle}</div>}
    </div>
  );
}

function ViewInvitationModal({
  isOpen,
  person,
  onClose,
}: {
  isOpen: boolean;
  person: CompanyAdminManagePeoplePage.Person | null;
  onClose: () => void;
}) {
  if (!person || !person.inviteLinkUrl) return null;

  return (
    <LegacyModal title="Invitation URL" isOpen={isOpen} onClose={onClose} size="lg">
      <InvitationUrl url={person.inviteLinkUrl} personName={person.fullName} />
    </LegacyModal>
  );
}

function RenewInvitationModal({
  isOpen,
  person,
  onClose,
  inviteUrl,
}: {
  isOpen: boolean;
  person: CompanyAdminManagePeoplePage.Person | null;
  onClose: () => void;
  inviteUrl: string;
}) {
  if (!person) return null;

  return (
    <LegacyModal title="New invitation URL" isOpen={isOpen} onClose={onClose} size="lg">
      <InvitationUrl url={inviteUrl} personName={person.fullName} />
    </LegacyModal>
  );
}
