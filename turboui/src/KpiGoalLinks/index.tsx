import React from "react";
import { useTranslation } from "react-i18next";
import type { KpiGoalLinkItem } from "../ApiTypes";
import { SecondaryButton } from "../Button";
import { UnstyledButton } from "../Button/UnstalyedButton";
import { Input } from "../Forms";
import { BlackLink } from "../Link";
import { Modal } from "../Modal";

export interface KpiGoalLinksProps {
  items: KpiGoalLinkItem[];
  href: (item: KpiGoalLinkItem) => string;
  canLink: boolean;
  loading: boolean;
  error: boolean;
  retry: () => void;
  saving: boolean;
  setLink: (id: string, linked: boolean) => void;
  search: (query: string | null) => void;
  picker: { query: string; items: KpiGoalLinkItem[]; loading: boolean; error: boolean; retry: () => void } | null;
}

export function KpiGoalLinks({ data }: { data: KpiGoalLinksProps | false }) {
  const { t } = useTranslation();
  if (data === false) return null;

  const title = t("Linked KPIs");
  const action = t("Link KPI");
  const searchLabel = t("Search KPIs");
  const picker = data.picker;

  return (
    <section data-test-id="kpi-goal-links" aria-label={title}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-bold">{title}</h2>
        {data.canLink && !data.error && (
          <SecondaryButton testId="link-resource" size="xxs" onClick={() => data.search("")} disabled={data.saving}>
            {action}
          </SecondaryButton>
        )}
      </div>
      {data.error ? (
        <LoadError retry={data.retry} />
      ) : data.loading ? (
        <p role="status" className="mt-2 text-sm text-content-dimmed">
          {t("Loading…")}
        </p>
      ) : data.items.length === 0 ? (
        <p className="mt-2 text-sm text-content-dimmed">{t("None")}</p>
      ) : (
        <ul className="mt-2 divide-y divide-stroke-base">
          {data.items.map((item) => (
            <li key={item.id} className="group/link-row flex items-center justify-between gap-3 py-2">
              <BlackLink
                testId={`linked-${item.id}`}
                to={data.href(item)}
                underline="hover"
                className="min-w-0 break-words text-sm"
              >
                {item.name}
                {item.spaceName && <span className="ml-2 text-xs text-content-dimmed">{item.spaceName}</span>}
              </BlackLink>
              {item.canUnlink && (
                <SecondaryButton
                  testId={`unlink-${item.id}`}
                  className="opacity-0 group-hover/link-row:opacity-100 group-focus-within/link-row:opacity-100 [@media(hover:none)]:opacity-100"
                  size="xxs"
                  disabled={data.saving}
                  onClick={() => data.setLink(item.id, false)}
                  ariaLabel={t("Unlink {{name}}", { name: item.name })}
                >
                  {t("Unlink")}
                </SecondaryButton>
              )}
            </li>
          ))}
        </ul>
      )}

      {picker && data.canLink && !data.error && (
        <Modal isOpen title={action} size="small" onClose={() => data.search(null)}>
          <Input
            autoFocus
            aria-label={searchLabel}
            placeholder={searchLabel}
            value={picker.query}
            onChange={(event) => data.search(event.target.value)}
          />
          <div className="mt-3 max-h-64 overflow-y-auto text-sm" aria-live="polite">
            {picker.error ? (
              <LoadError retry={picker.retry} />
            ) : picker.loading ? (
              <p className="p-2 text-content-dimmed">{t("Loading…")}</p>
            ) : !picker.items.length ? (
              <p className="p-2 text-content-dimmed">{t("No options")}</p>
            ) : (
              picker.items.map((item) => (
                <UnstyledButton
                  testId={`choose-${item.id}`}
                  key={item.id}
                  disabled={data.saving}
                  onClick={() => data.setLink(item.id, true)}
                  className="flex w-full items-baseline justify-between gap-3 rounded px-2 py-2 text-left hover:bg-surface-highlight focus-visible:bg-surface-highlight"
                >
                  <span className="min-w-0 break-words">{item.name}</span>
                  {item.spaceName && <span className="text-xs text-content-dimmed">{item.spaceName}</span>}
                </UnstyledButton>
              ))
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}

function LoadError({ retry }: { retry: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-sm text-content-dimmed">
      {t("Something went wrong. Please try again.")}
      <SecondaryButton size="xxs" onClick={retry}>
        {t("Retry")}
      </SecondaryButton>
    </div>
  );
}
