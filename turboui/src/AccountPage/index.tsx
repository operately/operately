import React from "react";
import { Page } from "../Page";
import { Avatar } from "../Avatar";
import { IconUserCircle, IconPalette, IconLockPassword, IconDoorExit } from "../icons";
import classNames from "../utils/classnames";
import { BlackLink } from "../Link";

export namespace AccountPage {
  export interface Person {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  }

  export interface ActionLink {
    icon: React.ComponentType<{ size: number }>;
    label: string;
    to: string;
    testId: string;
  }

  export interface ActionButton {
    icon: React.ComponentType<{ size: number }>;
    label: string;
    onClick: () => void;
    testId: string;
  }

  export interface Props {
    person: Person;
    profilePath: string;
    appearancePath: string;
    securityPath: string;
    homePath: string;
    onLogOut: () => void;
  }
}

export function AccountPage(props: AccountPage.Props) {
  const actionLinks: AccountPage.ActionLink[] = [
    {
      icon: IconUserCircle,
      label: "Profile",
      to: props.profilePath,
      testId: "profile-link",
    },
    {
      icon: IconPalette,
      label: "Appearance",
      to: props.appearancePath,
      testId: "appearance-link",
    },
    {
      icon: IconLockPassword,
      label: "Password & Security",
      to: props.securityPath,
      testId: "password-link",
    },
  ];

  const actionButtons: AccountPage.ActionButton[] = [
    {
      icon: IconDoorExit,
      label: "Sign Out",
      onClick: props.onLogOut,
      testId: "log-out-button",
    },
  ];

  const navigation = [
    {
      to: props.homePath,
      label: "Home",
    },
  ];

  return (
    <Page title="My Account" size="small" testId="my-account-page" navigation={navigation}>
      <div className="p-8">
        <PageTitle />
        <UserInfo person={props.person} />

        <div className="flex flex-col gap-8">
          <ActionLinksGroup links={actionLinks} />
          <ActionButtonsGroup buttons={actionButtons} />
        </div>
      </div>
    </Page>
  );
}

function PageTitle() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <FancyLineSeparator />
      <h1 className="text-4xl font-extrabold text-center">My Account</h1>
      <FancyLineSeparator />
    </div>
  );
}

function FancyLineSeparator() {
  return (
    <div
      className="flex-1"
      style={{
        height: "2px",
        background: "linear-gradient(90deg, var(--color-pink-600) 0%, var(--color-sky-600) 100%)",
      }}
    />
  );
}

function UserInfo({ person }: { person: AccountPage.Person }) {
  return (
    <div className="flex items-center gap-3 mb-8 p-3 bg-surface-dimmed rounded-lg border border-surface-outline">
      <Avatar person={person} size={48} />
      <div className="flex flex-col">
        <div className="text-lg font-semibold text-content-base">{person.fullName}</div>
        <div className="text-xs text-content-dimmed">{person.email}</div>
      </div>
    </div>
  );
}

function ActionLinksGroup({ links }: { links: AccountPage.ActionLink[] }) {
  return (
    <div className={actionGroupStyle}>
      {links.map((link, index) => (
        <ActionLinkItem key={index} {...link} />
      ))}
    </div>
  );
}

function ActionButtonsGroup({ buttons }: { buttons: AccountPage.ActionButton[] }) {
  return (
    <div className={actionGroupStyle}>
      {buttons.map((button, index) => (
        <ActionButtonItem key={index} {...button} />
      ))}
    </div>
  );
}

function ActionLinkItem({ icon, label, to, testId }: AccountPage.ActionLink) {
  return (
    <BlackLink to={to} className={actionItemStyle} testId={testId} underline="never">
      {React.createElement(icon, { size: 24 })} {label}
    </BlackLink>
  );
}

function ActionButtonItem({ icon, label, onClick, testId }: AccountPage.ActionButton) {
  return (
    <div onClick={onClick} className={actionItemStyle} data-test-id={testId}>
      {React.createElement(icon, { size: 24 })} {label}
    </div>
  );
}

const actionGroupStyle = classNames(
  "bg-surface-dimmed",
  "rounded-lg",
  "overflow-hidden",
  "divide-y divide-surface-outline",
  "border border-surface-outline",
);

const actionItemStyle = classNames(
  "flex items-center gap-4",
  "hover:bg-surface-accent",
  "cursor-pointer",
  "px-4 py-3",
  "font-bold text-lg",
);
