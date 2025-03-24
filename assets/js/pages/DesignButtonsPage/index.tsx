import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { PrimaryButton, GhostButton, SecondaryButton } from "@/components/Buttons";
import { MenuLinkItem, SubMenu } from "@/components/Menu";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"Buttons"}>
      <Paper.Root>
        <Paper.Navigation
          items={[
            { to: "/", label: "Lobby" },
            { to: "/__design__", label: "Design System" },
          ]}
        />

        <Paper.Body>
          <Paper.Header title="Buttons" />

          <div className="mb-8">
            <p className="mt-2">
              Operately uses rounded primary and secondary buttons. The primary button is used for the main action on a
              page, while the secondary button is used for secondary actions or as a subtle call to action. We write UI
              copy in active voice, not capitalized.
            </p>
          </div>

          <h3 className="font-bold mb-4">Primary buttons</h3>

          <div className="flex items-center space-x-4">
            <PrimaryButton size="xxs">Button text</PrimaryButton>
            <PrimaryButton size="xs">Button text</PrimaryButton>
            <PrimaryButton size="sm">Button text</PrimaryButton>
            <PrimaryButton size="base">Button text</PrimaryButton>
            <PrimaryButton size="lg">Button text</PrimaryButton>
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <PrimaryButton loading={true} size="xxs">
              Button text
            </PrimaryButton>
            <PrimaryButton loading={true} size="xs">
              Button text
            </PrimaryButton>
            <PrimaryButton loading={true} size="sm">
              Button text
            </PrimaryButton>
            <PrimaryButton loading={true} size="base">
              Button text
            </PrimaryButton>
            <PrimaryButton loading={true} size="lg">
              Button text
            </PrimaryButton>
          </div>

          <h3 className="font-bold mt-8 mb-4">Ghost buttons</h3>

          <div className="flex items-center space-x-4 w-auto">
            <GhostButton size="xxs">Button text</GhostButton>
            <GhostButton size="xs">Button text</GhostButton>
            <GhostButton size="sm">Button text</GhostButton>
            <GhostButton size="base">Button text</GhostButton>
            <GhostButton size="lg">Button text</GhostButton>
          </div>

          <div className="flex items-center space-x-4 w-auto mt-4">
            <GhostButton loading={true} size="xxs">
              Button text
            </GhostButton>
            <GhostButton loading={true} size="xs">
              Button text
            </GhostButton>
            <GhostButton loading={true} size="sm">
              Button text
            </GhostButton>
            <GhostButton loading={true} size="base">
              Button text
            </GhostButton>
            <GhostButton loading={true} size="lg">
              Button text
            </GhostButton>
          </div>

          <h3 className="font-bold mt-8 mb-4">Secondary buttons</h3>

          <div className="flex items-center space-x-4 w-auto">
            <SecondaryButton size="xxs">Button text</SecondaryButton>
            <SecondaryButton size="xs">Button text</SecondaryButton>
            <SecondaryButton size="sm">Button text</SecondaryButton>
            <SecondaryButton size="base">Button text</SecondaryButton>
            <SecondaryButton size="lg">Button text</SecondaryButton>
          </div>

          <div className="flex items-center space-x-4 w-auto mt-4">
            <SecondaryButton loading={true} size="xxs">
              Button text
            </SecondaryButton>
            <SecondaryButton loading={true} size="xs">
              Button text
            </SecondaryButton>
            <SecondaryButton loading={true} size="sm">
              Button text
            </SecondaryButton>
            <SecondaryButton loading={true} size="base">
              Button text
            </SecondaryButton>
            <SecondaryButton loading={true} size="lg">
              Button text
            </SecondaryButton>
          </div>

          <h3 className="font-bold mt-8 mb-4">Buttons with menu</h3>

          <div className="flex items-center space-x-4 w-auto mt-4">
            <PrimaryButton size="xxs" options={buttonOptions}>
              Add
            </PrimaryButton>

            <SecondaryButton size="xs" options={buttonOptions}>
              New
            </SecondaryButton>

            <GhostButton size="sm" options={buttonOptions}>
              New
            </GhostButton>

            <PrimaryButton size="base" options={buttonOptions}>
              New
            </PrimaryButton>

            <SecondaryButton size="lg" options={buttonOptions}>
              New
            </SecondaryButton>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

const buttonOptions = [
  <MenuLinkItem to="" icon={Icons.IconFile}>
    New document
  </MenuLinkItem>,
  <MenuLinkItem to="" icon={Icons.IconFolderFilled}>
    Create a new folder
  </MenuLinkItem>,
  <MenuLinkItem to="" icon={Icons.IconUpload}>
    Upload files
  </MenuLinkItem>,
  <SubMenu label="Add link to..." icon={Icons.IconLink}>
    <MenuLinkItem to="" icon={Icons.IconUpload}>
      Google Drive
    </MenuLinkItem>
  </SubMenu>,
];
