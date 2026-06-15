import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as PageOptions from "@/components/PaperContainer/PageOptions";
import * as AdminApi from "@/ee/admin_api";
import { useDebouncedValue } from "@/ee/hooks/useDebouncedValue";
import * as React from "react";

import { AccountActionsMenu, PendingAccountAction, useAccountActions } from "./AccountActionsMenu";
import FormattedTime from "@/components/FormattedTime";
import classNames from "classnames";
import {
  AvatarList,
  ConfirmDialog,
  DivLink,
  IconBuilding,
  IconBuildingCommunity,
  IconInfoCircle,
  IconMail,
  IconSearch,
  IconShieldLock,
  IconUser,
  IconX,
  Tabs,
  Tooltip,
  useTabs,
} from "turboui";

const SEARCH_DEBOUNCE_MS = 250;

export const loader = async () => {
  return {};
};

export function Page() {
  const tabs = useTabs("active", [
    { id: "active", label: "Active Companies", icon: <IconBuildingCommunity size={16} /> },
    { id: "all", label: "All Companies", icon: <IconBuilding size={16} /> },
    { id: "accounts", label: "All Accounts", icon: <IconUser size={16} /> },
  ]);
  const [searchQueries, setSearchQueries] = React.useState({
    active: "",
    all: "",
    accounts: "",
  });

  const searchQuery = searchQueries[tabs.active as keyof typeof searchQueries];

  return (
    <Pages.Page title={"Administration"} testId="saas-admin-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <Options />
          <PageHeader activeTab={tabs.active} />
          <div className="-mx-4 -mb-px">
            <Tabs tabs={tabs} />
          </div>
          <SearchBox
            value={searchQuery}
            onChange={(value) => setSearchQueries((prev) => ({ ...prev, [tabs.active]: value }))}
            placeholder={searchPlaceholder(tabs.active)}
          />
          <CompanyListContainer activeTab={tabs.active} searchQuery={searchQuery} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageHeader({ activeTab }: { activeTab: string }) {
  if (activeTab === "active") {
    return <HeaderWithInfo />;
  }

  if (activeTab === "accounts") {
    return <Paper.Header title="All Accounts" />;
  }

  return <Paper.Header title="All Companies" />;
}

function HeaderWithInfo() {
  const tooltipContent = (
    <div className="max-w-xs">
      <div className="font-bold text-sm mb-2">Active Company Criteria</div>
      <ul className="text-xs space-y-1">
        <li>• Have multiple team members (2 or more)</li>
        <li>• Have multiple goals and projects (2 or more)</li>
        <li>• Show recent activity within the last 14 days</li>
      </ul>
    </div>
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Active Companies</h1>
        <Tooltip content={tooltipContent} testId="active-companies-info">
          <IconInfoCircle size={16} className="text-content-dimmed hover:text-content-accent cursor-help" />
        </Tooltip>
      </div>
    </div>
  );
}

function CompanyListContainer({ activeTab, searchQuery }: { activeTab: string; searchQuery: string }) {
  if (activeTab === "active") {
    return <ActiveCompanyList searchQuery={searchQuery} />;
  } else if (activeTab === "all") {
    return <AllCompanyList searchQuery={searchQuery} />;
  } else {
    return <AllAccountList searchQuery={searchQuery} />;
  }
}

function AllCompanyList({ searchQuery }: { searchQuery: string }) {
  const { data: companiesData, loading, error } = AdminApi.useGetCompanies({});
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent">Loading companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading companies: {error.message}</p>
      </div>
    );
  }

  const companies = companiesData?.companies || [];
  const filteredCompanies = filterCompanies(companies, debouncedSearchQuery);

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent text-lg">No companies found</p>
      </div>
    );
  }

  if (filteredCompanies.length === 0) {
    return <EmptySearchState itemType="companies" searchQuery={debouncedSearchQuery} />;
  }

  return <CompanyTable companies={filteredCompanies} />;
}

function AllAccountList({ searchQuery }: { searchQuery: string }) {
  const { data: accountsData, loading, error, refetch } = AdminApi.useGetAccounts({});
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent">Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading accounts: {error.message}</p>
      </div>
    );
  }

  const accounts = accountsData?.accounts || [];
  const filteredAccounts = filterAccounts(accounts, debouncedSearchQuery);

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent text-lg">No accounts found</p>
      </div>
    );
  }

  if (filteredAccounts.length === 0) {
    return <EmptySearchState itemType="accounts" searchQuery={debouncedSearchQuery} />;
  }

  return <AccountTable accounts={filteredAccounts} refetch={refetch} />;
}

function ActiveCompanyList({ searchQuery }: { searchQuery: string }) {
  const { data: companiesData, loading, error } = AdminApi.useGetActiveCompanies({});
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent">Loading active companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading active companies: {error.message}</p>
      </div>
    );
  }

  const companies = companiesData?.companies || [];
  const filteredCompanies = filterCompanies(companies, debouncedSearchQuery);

  if (companies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-content-accent text-lg">No active companies found</p>
        <p className="text-content-subtle text-sm mt-2">Companies need to meet all activity criteria to appear here</p>
      </div>
    );
  }

  if (filteredCompanies.length === 0) {
    return <EmptySearchState itemType="companies" searchQuery={debouncedSearchQuery} />;
  }

  return <CompanyTable companies={filteredCompanies} />;
}

function CompanyTable({ companies }: { companies: AdminApi.Company[] }) {
  return (
    <div>
      <TableRow header gridTemplateColumns="0.5fr 4fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr">
        <div>#</div>
        <div>Company</div>
        <div className="text-right">People</div>
        <div className="text-right">Spaces</div>
        <div className="text-right">Goals</div>
        <div className="text-right">Projects</div>
        <div className="text-right">Owners</div>
        <div className="text-right">Last Activity</div>
        <div className="text-right">Created At</div>
      </TableRow>

      {companies.map((company, index) => (
        <TableRow key={company.id} linkTo={`/admin/companies/${company.id}`} gridTemplateColumns="0.5fr 4fr 1fr 1fr 1fr 1fr 1fr 1.5fr 1.5fr">
          <div>{index + 1}</div>
          <div>{company.name}</div>
          <div className="text-right">{company.peopleCount}</div>
          <div className="text-right">{company.spacesCount}</div>
          <div className="text-right">{company.goalsCount}</div>
          <div className="text-right">{company.projectsCount}</div>

          <div className="flex justify-end -mt-0.5">
            <AvatarList people={company.owners ?? []} size={20} maxElements={3} stacked />
          </div>

          <div className="text-right">
            {company.lastActivityAt && <FormattedTime time={company.lastActivityAt} format="relative" />}
          </div>

          <div className="text-right">
            {company.insertedAt && <FormattedTime time={company.insertedAt} format="relative" />}
          </div>
        </TableRow>
      ))}

      <VersionBadge />
    </div>
  );
}

function AccountTable({ accounts, refetch }: { accounts: AdminApi.Account[]; refetch: () => void }) {
  const [pendingAction, setPendingAction] = React.useState<PendingAccountAction | null>(null);

  const closeDialog = () => setPendingAction(null);
  const { handleConfirmAction, dialogContent } = useAccountActions({ pendingAction, closeDialog, refetch });

  return (
    <div>
      <TableRow header gridTemplateColumns="0.5fr 2fr 2.5fr 1fr 1fr 1fr 1.5fr 0.75fr">
        <div>#</div>
        <div>Account</div>
        <div>Email</div>
        <div className="text-center">Companies</div>
        <div className="text-center">Owned Companies</div>
        <div className="text-center">Site Admin</div>
        <div className="text-center">Created At</div>
        <div className="text-right">Actions</div>
      </TableRow>

      {accounts.map((account, index) => (
        <TableRow key={account.id} gridTemplateColumns="0.5fr 2fr 2.5fr 1fr 1fr 1fr 1.5fr 0.75fr">
          <div>{index + 1}</div>
          <div className="font-medium">{account.fullName}</div>
          <div className="text-content-accent">{account.email}</div>
          <div className="text-center">{account.companiesCount}</div>
          <div className="text-center">{account.ownedCompaniesCount}</div>
          <div className="flex items-center justify-center gap-2">
            {account.siteAdmin ? <IconShieldLock size={16} className="text-content-accent" /> : null}
            <span>{account.siteAdmin ? "Yes" : "No"}</span>
          </div>
          <div className="text-center">
            <FormattedTime time={account.insertedAt} format="relative" />
          </div>
          <div className="flex justify-end">
            <AccountActionsMenu
              account={account}
              onPromote={() => setPendingAction({ type: "promote", account })}
              onDemote={() => setPendingAction({ type: "demote", account })}
              onDelete={() => setPendingAction({ type: "delete", account })}
            />
          </div>
        </TableRow>
      ))}

      <VersionBadge />

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onCancel={closeDialog}
        onConfirm={handleConfirmAction}
        title={dialogContent?.title || ""}
        message={dialogContent?.message || ""}
        confirmText={dialogContent?.confirmText || "Confirm"}
        cancelText="Cancel"
        variant={dialogContent?.variant || "default"}
        testId={dialogContent?.testId || "account-action-confirmation"}
      />
    </div>
  );
}

function TableRow({
  header,
  children,
  linkTo,
  gridTemplateColumns,
}: {
  header?: boolean;
  children: React.ReactNode;
  linkTo?: string;
  gridTemplateColumns: string;
}) {
  const className = classNames("grid pt-3 pb-2 items-center gap-2", {
    "border-y border-stroke-base": header,
    "border-b border-stroke-base": !header,
    "font-bold text-xs uppercase": header,
    "text-sm": !header,
    "-mx-4 px-4": true,
    "bg-surface-dimmed": header,
    "hover:bg-surface-highlight": !header,
    "cursor-pointer": !header && !!linkTo,
  });

  const style = { gridTemplateColumns };

  if (linkTo) {
    return <DivLink to={linkTo} className={className} style={style} children={children} />;
  } else {
    return <div className={className} style={style} children={children} />;
  }
}

function VersionBadge() {
  if (!window.appConfig.version) return null;

  return (
    <div className="flex justify-start mt-6 text-xs">
      <div className="bg-surface-dimmed px-3 py-1 rounded-full">Version: {window.appConfig.version}</div>
    </div>
  );
}

function Options() {
  return (
    <PageOptions.Root testId="options-button">
      <PageOptions.Link icon={IconMail} title="Email Configuration" to="/admin/email-settings" />
      <PageOptions.Link icon={IconInfoCircle} title="Site Messages" to="/admin/site-messages" />
      {window.appConfig.billingEnabled && (
        <PageOptions.Link icon={IconBuilding} title="Billing Catalog" to="/admin/billing-catalog" />
      )}
    </PageOptions.Root>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="my-4 flex items-center">
      <div className="flex w-full items-center gap-2 bg-surface-base">
        <IconSearch size={16} className="shrink-0 text-content-dimmed" />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent border-none outline-none text-sm text-content-base placeholder:text-content-dimmed"
          data-test-id="saas-admin-search-input"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded p-1 text-content-dimmed transition hover:bg-surface-highlight hover:text-content-base"
            aria-label="Clear search"
          >
            <IconX size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptySearchState({ itemType, searchQuery }: { itemType: "accounts" | "companies"; searchQuery: string }) {
  return (
    <div className="rounded-xl border border-dashed border-surface-outline bg-surface-dimmed/50 px-6 py-12 text-center">
      <p className="text-content-accent text-lg">No matching {itemType} found</p>
      <p className="mt-2 text-sm text-content-dimmed">
        No {itemType} matched <span className="font-medium text-content-accent">&ldquo;{searchQuery}&rdquo;</span>.
      </p>
    </div>
  );
}

function searchPlaceholder(activeTab: string) {
  if (activeTab === "accounts") {
    return "Search accounts by name or email";
  }

  return "Search companies by name";
}

function filterCompanies(companies: AdminApi.Company[], searchQuery: string) {
  const normalizedQuery = normalizeSearchQuery(searchQuery);

  if (!normalizedQuery) return companies;

  return companies.filter((company) => normalizeSearchQuery(company.name || "").includes(normalizedQuery));
}

function filterAccounts(accounts: AdminApi.Account[], searchQuery: string) {
  const normalizedQuery = normalizeSearchQuery(searchQuery);

  if (!normalizedQuery) return accounts;

  return accounts.filter((account) => {
    return (
      normalizeSearchQuery(account.fullName).includes(normalizedQuery) ||
      normalizeSearchQuery(account.email).includes(normalizedQuery)
    );
  });
}

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase();
}
