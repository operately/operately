import React from "react";
import { useTranslation } from "react-i18next";
import { PrimaryButton, SecondaryButton } from "../Button";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { Textfield } from "../FormElements/Textfield";
import {
  IconArrowUpRight,
  IconBook,
  IconBuilding,
  IconCheck,
  IconChevronRight,
  IconFileText,
  IconPlus,
  IconSearch,
  IconTarget,
} from "../icons";
import { Link } from "../Link";
import { Menu, MenuActionItem, MenuLinkItem, MenuSeparator } from "../Menu";
import { Modal } from "../Modal";
import { tn } from "../i18n";
import type { SpaceField } from "../SpaceField";
import { AddItemModal } from "../WorkMap/components/AddItemModal";
import { ZeroState } from "../WorkMap/components/ZeroState";
import type { ProjectTemplateSelection } from "../ProjectTemplateSelection";
import type { WorkMapV2Item } from "./filterWorkMap";
import { compareIds } from "../utils/ids";

const menuItemClass =
  "min-h-[35px] rounded-md !gap-2 !px-2.5 !text-[13px] !font-normal !text-content-base [&_svg]:size-3.5 [&_svg]:text-content-dimmed dark:data-[highlighted]:bg-[#3b4050]";
const primaryActionClass = "!bg-[#4265ce] !border-transparent hover:!bg-blue-700";

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
    opener?: HTMLButtonElement;
  } | null>(null);
  const addWorkButton = React.useRef<HTMLButtonElement>(null);
  const [choosing, setChoosing] = React.useState(false);

  if (!creation) return {};

  function open(type: AddItemModal.ItemType, opener?: HTMLButtonElement) {
    setForm({ type, space: creation?.defaultSpace, opener });
  }
  const { templates, templateLibraryPath } = creation;

  return {
    addGoal: (event: React.MouseEvent<HTMLButtonElement>) => open("goal", event.currentTarget),
    addProject: (event: React.MouseEvent<HTMLButtonElement>) => open("project", event.currentTarget),
    quickAdd: (item: WorkMapV2Item) => {
      const space = creation.spaces.find((s) => compareIds(s.id, item.space?.id));
      if (item.type !== "goal" || !space) return null;
      return (
        <SecondaryButton
          size="xxs"
          testId="add-subitem"
          className="opacity-0 group-hover/row:opacity-100 focus:opacity-100"
          onClick={(event) => setForm({ type: "goal", parent: item, space, opener: event.currentTarget })}
        >
          {t("Add")}
        </SecondaryButton>
      );
    },
    menu: (
      <Menu
        triggerRef={addWorkButton}
        onCloseAutoFocus={(event) => {
          if (choosing || form) event.preventDefault();
        }}
        testId="work-map-add-work"
        align="end"
        triggerLabel={t("Add work")}
        triggerIcon={IconPlus}
        showTriggerChevron
        triggerClassName={`h-8 shrink-0 !rounded-md !px-2.5 !text-[13px] !text-white-1 ${primaryActionClass}`}
        contentProps={{
          className:
            "w-[259px] !rounded-[10px] !p-[7px] dark:bg-[#2b2d34] dark:ring-[#50535f] [&>[role=separator]]:mx-0.5 [&>[role=separator]]:my-1.5",
        }}
      >
        <MenuActionItem className={menuItemClass} icon={IconTarget} onClick={() => open("goal")}>
          {t("Goal")}
        </MenuActionItem>
        <MenuActionItem className={menuItemClass} icon={IconFileText} onClick={() => open("project")}>
          {t("Project")}
        </MenuActionItem>
        <MenuActionItem
          testId="work-map-template-picker"
          className={menuItemClass}
          icon={IconBook}
          onClick={() => setChoosing(true)}
        >
          {t("Project from template…")}
        </MenuActionItem>
        <MenuSeparator />
        <MenuLinkItem to={templateLibraryPath} className={menuItemClass} icon={IconBook}>
          <span className="flex items-center justify-between gap-2">
            {t("Open template library")}
            <IconChevronRight size={14} aria-hidden />
          </span>
        </MenuLinkItem>
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
            onClose={() => {
              setChoosing(false);
              addWorkButton.current?.focus();
            }}
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
            close={() => {
              setForm(null);
              (form.opener?.isConnected ? form.opener : addWorkButton.current)?.focus();
            }}
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
    <Modal
      trapFocus
      isOpen
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5 text-[19px] leading-6">
          <IconBook size={19} aria-hidden className="shrink-0 text-link-base dark:text-[#a7bcff]" />
          {t("Choose a project template")}
        </span>
      }
      contentClassName="!max-w-[592px] !rounded-xl border border-surface-outline dark:border-[#545763] dark:bg-[#2a2c33]"
      headerClassName="gap-2 !border-0 !pb-2 !pt-5 [&>button]:text-content-dimmed"
      contentPadding=""
    >
      <div className="px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-[13px]">
          <span className="flex min-w-0 items-center gap-2 text-content-dimmed">
            <IconBuilding size={14} aria-hidden className="shrink-0" />
            <span className="break-words min-w-0">{scopeName}</span>
          </span>
          <Link
            to={templateLibraryPath}
            target="_blank"
            underline="hover"
            className="inline-flex items-center gap-1 text-xs font-medium dark:text-[#a7bcff]"
          >
            {t("Open template library")} <IconArrowUpRight size={13} aria-hidden />
          </Link>
        </div>

        <div className="relative">
          <IconSearch
            size={14}
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-content-dimmed"
          />
          <Textfield
            autoFocus
            aria-label={t("Search templates")}
            placeholder={t("Search {{name}} templates…", { name: scopeName })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="[&>div]:rounded-md [&>div]:outline-1 dark:[&>div]:bg-[#202126] dark:[&>div]:border-[#525765] dark:[&>div]:outline-[#829be4]"
            inputClassName="h-8 min-w-0 !pl-8 text-xs"
          />
        </div>
      </div>

      <div className="mt-5 max-h-80 space-y-1.5 overflow-y-auto px-6 pb-2">
        {results.map((tpl) => {
          const isSelected = selected?.id === tpl.id;
          return (
            <UnstyledButton
              key={tpl.id}
              testId={`choose-template-${tpl.id}`}
              aria-pressed={isSelected}
              className={`flex min-h-[66px] w-full items-center gap-3 rounded-lg border px-3.5 py-2 text-left focus-visible:outline focus-visible:-outline-offset-2 focus-visible:outline-link-base ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:border-[#829be4] dark:bg-[#30394d]"
                  : "border-surface-outline hover:bg-surface-highlight dark:border-[#3a3c45] dark:bg-[#292b33] dark:hover:bg-[#343741]"
              }`}
              onClick={() => setSelectedId(tpl.id)}
            >
              <IconBook
                size={20}
                aria-hidden
                className={isSelected ? "shrink-0 text-link-base dark:text-[#a7bcff]" : "shrink-0 text-content-dimmed"}
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="break-words text-sm font-semibold">{tpl.name}</span>
                <span className="text-xs text-content-dimmed dark:text-[#c2c4ce]">
                  {tn("1 milestone", "{{count}} milestones", tpl.milestoneCount)} ·{" "}
                  {tn("1 task", "{{count}} tasks", tpl.taskCount)}
                </span>
              </span>
              {isSelected && (
                <IconCheck size={17} aria-hidden className="shrink-0 text-link-base dark:text-[#a7bcff]" />
              )}
            </UnstyledButton>
          );
        })}
        {!results.length && <p className="py-2 text-sm text-content-dimmed">{t("No templates found")}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-outline px-6 py-3.5 dark:border-[#3a3c45]">
        <UnstyledButton
          className="py-1 text-left text-xs font-medium text-content-dimmed hover:text-content-base hover:underline focus-visible:underline dark:text-[#c2c4ce]"
          onClick={onBlank}
        >
          {t("Start with a blank project")}
        </UnstyledButton>
        <PrimaryButton
          size="sm"
          className={`!px-2.5 !text-[13px] ${primaryActionClass}`}
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
