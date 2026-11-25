import React from "react";
import { useTranslation } from "react-i18next";
import { PrimaryButton, SecondaryButton } from "../Button";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { Textfield } from "../FormElements/Textfield";
import { IconPlus, IconGoal, IconProject } from "../icons";
import { BlackLink } from "../Link";
import { Menu, MenuActionItem, MenuLinkItem, MenuSeparator } from "../Menu";
import { Modal } from "../Modal";
import { tn } from "../i18n";
import type { SpaceField } from "../SpaceField";
import { AddItemModal } from "../WorkMap/components/AddItemModal";
import { ZeroState } from "../WorkMap/components/ZeroState";
import type { ProjectTemplateSelection } from "../ProjectTemplateSelection";
import type { WorkMapV2Item } from "./filterWorkMap";
import { compareIds } from "../utils/ids";

export interface WorkMapCreation {
  defaultSpace?: SpaceField.Space;
  spaces: SpaceField.Space[];
  spaceSearch: SpaceField.SearchSpaceFn;
  getSpacePrivacy?: AddItemModal.Props["getSpacePrivacy"];
  save: AddItemModal.Props["save"];
  templates: (ProjectTemplateSelection.Template & { milestoneCount: number; taskCount: number })[];
  onCreateProjectTemplate?: AddItemModal.Props["onCreateProjectTemplate"];
  templateLibraryPath: string;
  onFirstItemCreated?: AddItemModal.Props["onSaved"];
}

export function useAddWork(creation: WorkMapCreation | undefined, scopeName: string, spaceId?: string) {
  const { t } = useTranslation();
  const [form, setForm] = React.useState<{
    type: AddItemModal.ItemType;
    space?: SpaceField.Space;
    parent?: WorkMapV2Item;
    templateId?: string;
  } | null>(null);
  const [choosing, setChoosing] = React.useState(false);

  if (!creation) return {};

  function open(type: AddItemModal.ItemType) {
    setForm({ type, space: creation?.defaultSpace });
  }
  const { templates, templateLibraryPath } = creation;

  return {
    addGoal: () => open("goal"),
    addProject: () => open("project"),
    quickAdd: (item: WorkMapV2Item) => {
      const space = creation.spaces.find((s) => compareIds(s.id, item.space?.id));
      if (item.type !== "goal" || !space) return null;
      return (
        <SecondaryButton
          size="xxs"
          testId="add-subitem"
          className="opacity-0 group-hover/row:opacity-100 focus:opacity-100"
          onClick={() => setForm({ type: "goal", parent: item, space })}
        >
          {t("Add")}
        </SecondaryButton>
      );
    },
    menu: (
      <Menu
        testId="work-map-add-work"
        align="end"
        triggerLabel={t("Add work")}
        triggerIcon={IconPlus}
        triggerClassName="!rounded-md !bg-brand-1 !px-3 !text-white-1 hover:!bg-blue-600"
      >
        <MenuActionItem icon={IconGoal} onClick={() => open("goal")}>
          {t("Goal")}
        </MenuActionItem>
        <MenuActionItem icon={IconProject} onClick={() => open("project")}>
          {t("Project")}
        </MenuActionItem>
        <MenuActionItem
          testId="work-map-template-picker"
          onClick={() => {
            setChoosing(true);
          }}
        >
          {t("Project from template…")}
        </MenuActionItem>
        <MenuSeparator />
        <MenuLinkItem to={templateLibraryPath}>{t("Open template library")}</MenuLinkItem>
      </Menu>
    ),
    onboarding: creation.onFirstItemCreated && creation.defaultSpace && (
      <ZeroState
        variant="first-project"
        addingEnabled
        spaceSearch={creation.spaceSearch}
        addItem={creation.save}
        addItemDefaultSpace={creation.defaultSpace}
        onItemCreated={creation.onFirstItemCreated}
        getSpacePrivacy={creation.getSpacePrivacy}
      />
    ),
    dialogs: (
      <>
        {choosing && (
          <TemplatePicker
            scopeName={scopeName}
            templates={templates.filter((tpl) => !spaceId || compareIds(tpl.spaceId, spaceId))}
            templateLibraryPath={templateLibraryPath}
            onClose={() => setChoosing(false)}
            onBlank={() => {
              setChoosing(false);
              open("project");
            }}
            onSelect={(tpl) => {
              setChoosing(false);
              setForm({
                type: "project",
                templateId: tpl.id,
                space: creation.spaces.find((s) => compareIds(s.id, tpl.spaceId)),
              });
            }}
          />
        )}
        {form && (
          <AddItemModal
            isOpen
            close={() => setForm(null)}
            parentGoal={form.parent ?? null}
            initialItemType={form.type}
            initialTemplateId={form.templateId}
            space={form.space}
            spaceSearch={creation.spaceSearch}
            save={creation.save}
            templates={templates}
            templateLibraryPath={templateLibraryPath}
            onCreateProjectTemplate={creation.onCreateProjectTemplate}
            getSpacePrivacy={creation.getSpacePrivacy}
            hideTypeSelector={!form.parent}
          />
        )}
      </>
    ),
  };
}

function TemplatePicker({
  scopeName,
  templates,
  templateLibraryPath,
  onSelect,
  onClose,
  onBlank,
}: Pick<WorkMapCreation, "templates" | "templateLibraryPath"> & {
  scopeName: string;
  onSelect: (tpl: WorkMapCreation["templates"][number]) => void;
  onBlank: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(templates[0]?.id);
  const results = templates.filter((tpl) => tpl.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const selected = results.find((tpl) => tpl.id === selectedId) ?? results[0];

  return (
    <Modal isOpen onClose={onClose} title={t("Choose a project template")} size="small">
      <div className="mb-3 flex justify-between text-sm">
        <strong>{scopeName}</strong>
        <BlackLink to={templateLibraryPath}>{t("Open template library")}</BlackLink>
      </div>
      <Textfield
        autoFocus
        aria-label={t("Search templates")}
        placeholder={t("Search {{name}} templates…", { name: scopeName })}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="my-3 max-h-80 overflow-y-auto">
        {results.map((tpl) => (
          <UnstyledButton
            key={tpl.id}
            testId={`choose-template-${tpl.id}`}
            aria-pressed={selected?.id === tpl.id}
            className={`flex w-full flex-col items-start rounded px-2 py-2 text-left hover:bg-surface-highlight ${selected?.id === tpl.id ? "bg-surface-accent ring-1 ring-inset ring-brand-1" : ""}`}
            onClick={() => setSelectedId(tpl.id)}
          >
            <strong>{tpl.name}</strong>
            <span className="text-xs text-content-dimmed">
              {tn("1 milestone", "{{count}} milestones", tpl.milestoneCount)} ·{" "}
              {tn("1 task", "{{count}} tasks", tpl.taskCount)}
            </span>
          </UnstyledButton>
        ))}
        {!results.length && <p className="p-2 text-sm text-content-dimmed">{t("No templates found")}</p>}
      </div>

      <div className="flex justify-between gap-2">
        <SecondaryButton size="sm" onClick={onBlank}>
          {t("Start with a blank project")}
        </SecondaryButton>
        <PrimaryButton
          size="sm"
          testId="use-template"
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          {t("Use template")}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
