import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  useArchiveBillingPlanDefinition,
  useUnarchiveBillingPlanDefinition,
  useArchiveBillingProduct,
  useSetActiveBillingProduct,
  useSyncBillingProductsFromPolar,
  useRefreshBillingCatalog,
} from "@/ee/models/billingCatalogLifecycle";
import { useLoadedData } from "./loader";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import classNames from "classnames";
import {
  ConfirmDialog,
  formatStorageBytes,
  IconBuilding,
  IconCheck,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconTrash,
  Menu,
  MenuActionItem,
  Tabs,
  Tooltip,
  useTabs,
} from "turboui";

import { PlanDefinitionModal } from "./PlanDefinitionModal";
import { ProductModal } from "./ProductModal";

export { loader } from "./loader";

export async function syncBillingCatalogProducts(sync: (input: {}) => Promise<unknown>, refresh: () => void) {
  await sync({});
  refresh();
}

export async function archiveBillingCatalogProduct(
  archive: (input: { id: string }) => Promise<unknown>,
  productId: string,
  refresh: () => void,
  onArchived?: () => void,
) {
  await archive({ id: productId });
  onArchived?.();
  refresh();
}

export async function setActiveBillingCatalogProduct(
  setActive: (input: { id: string }) => Promise<unknown>,
  productId: string,
  refresh: () => void,
) {
  await setActive({ id: productId });
  refresh();
}

export async function archiveBillingPlanDefinition(
  archive: (input: { id: string }) => Promise<unknown>,
  planDefinitionId: string,
  refresh: () => void,
  onArchived?: () => void,
) {
  await archive({ id: planDefinitionId });
  onArchived?.();
  refresh();
}

export async function unarchiveBillingPlanDefinition(
  unarchive: (input: { id: string }) => Promise<unknown>,
  planDefinitionId: string,
  refresh: () => void,
) {
  await unarchive({ id: planDefinitionId });
  refresh();
}

export function Page() {
  const { t } = useTranslation();
  const { products, planDefinitions } = useLoadedData();
  const tabs = useTabs("products", [
    { id: "products", label: t("Products"), icon: <IconBuilding size={16} /> },
    { id: "plans", label: t("Plans"), icon: <IconSettings size={16} /> },
  ]);
  const refresh = useRefreshBillingCatalog();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<AdminApi.BillingProduct | undefined>(undefined);
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [editingPlanDefinition, setEditingPlanDefinition] = React.useState<AdminApi.BillingPlanDefinition | undefined>(
    undefined,
  );

  const openCreate = () => {
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const openEdit = (product: AdminApi.BillingProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const openPlanEdit = (planDefinition: AdminApi.BillingPlanDefinition) => {
    setEditingPlanDefinition(planDefinition);
    setIsPlanModalOpen(true);
  };

  const openPlanCreate = () => {
    setEditingPlanDefinition(undefined);
    setIsPlanModalOpen(true);
  };

  const closePlanModal = () => {
    setIsPlanModalOpen(false);
    setEditingPlanDefinition(undefined);
  };

  return (
    <Pages.Page title={t("Billing Catalog")} testId="saas-admin-billing-catalog-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <PageHeader activeTab={tabs.active} onCreate={openCreate} onRefresh={refresh} />
          {tabs.active === "plans" && <PlanHeaderActions onCreate={openPlanCreate} />}
          <div className="-mx-4 -mb-px">
            <Tabs tabs={tabs} />
          </div>
          {tabs.active === "plans" ? (
            <PlanDefinitionTable planDefinitions={planDefinitions} onEdit={openPlanEdit} onRefresh={refresh} />
          ) : (
            <ProductTable products={products} onEdit={openEdit} onRefresh={refresh} />
          )}
          <PlanDefinitionModal
            key={editingPlanDefinition?.id ?? "plan-definition"}
            isOpen={isPlanModalOpen}
            onClose={closePlanModal}
            onSuccess={refresh}
            planDefinition={editingPlanDefinition}
          />
          <ProductModal
            key={editingProduct?.id ?? "new"}
            isOpen={isModalOpen}
            onClose={closeModal}
            onSuccess={refresh}
            product={editingProduct}
            planDefinitions={planDefinitions}
          />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageHeader({
  activeTab,
  onCreate,
  onRefresh,
}: {
  activeTab: string;
  onCreate: () => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between">
      <Paper.Header title={t("Billing Catalog")} />
      {activeTab === "products" && (
        <div className="flex items-center gap-3">
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-dimmed hover:bg-surface-highlight rounded border border-stroke-base transition-colors"
          >
            <IconPlus size={16} />
            {t("Create product")}
          </button>
          <SyncButton onRefresh={onRefresh} />
        </div>
      )}
    </div>
  );
}

function PlanHeaderActions({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 flex justify-end">
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-dimmed hover:bg-surface-highlight rounded border border-stroke-base transition-colors"
      >
        <IconPlus size={16} />
        {t("Create plan")}
      </button>
    </div>
  );
}

function SyncButton({ onRefresh }: { onRefresh: () => void }) {
  const { t } = useTranslation();
  const { mutateAsync: sync, isPending: loading } = useSyncBillingProductsFromPolar();

  const handleSync = async () => {
    await syncBillingCatalogProducts(sync, onRefresh);
  };

  return (
    <Tooltip
      content={t(
        "Imports and reconciles Operately-managed Polar products. Unrelated manual Polar products are ignored.",
      )}
      size="sm"
    >
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-dimmed hover:bg-surface-highlight rounded border border-stroke-base transition-colors"
      >
        <IconRefresh size={16} className={classNames({ "animate-spin": loading })} />
        {t("Sync from Polar")}
      </button>
    </Tooltip>
  );
}

function ProductTable({
  products,
  onEdit,
  onRefresh,
}: {
  products: AdminApi.BillingProduct[];
  onEdit: (product: AdminApi.BillingProduct) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      <TableRow header gridTemplateColumns="2fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr">
        <div>{t("Product")}</div>
        <div>{t("Provider")}</div>
        <div>{t("Plan Family")}</div>
        <div>{t("Interval")}</div>
        <div className="text-right">{t("Price")}</div>
        <div className="text-center">{t("Status")}</div>
        <div className="text-center">{t("Created")}</div>
        <div className="text-right">{t("Actions")}</div>
      </TableRow>

      {products.map((product) => (
        <ProductRow key={product.id} product={product} onEdit={onEdit} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function PlanDefinitionTable({
  planDefinitions,
  onEdit,
  onRefresh,
}: {
  planDefinitions: AdminApi.BillingPlanDefinition[];
  onEdit: (planDefinition: AdminApi.BillingPlanDefinition) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      <TableRow header gridTemplateColumns="1.5fr 1fr 1fr 1.25fr 1fr 1fr 1.25fr 1.5fr 0.75fr">
        <div>{t("Plan")}</div>
        <div>{t("Key")}</div>
        <div>{t("Status")}</div>
        <div>{t("Behavior")}</div>
        <div className="text-center">{t("Selectable")}</div>
        <div className="text-right">{t("Tier rank")}</div>
        <div className="text-right">{t("Member limit")}</div>
        <div className="text-right">{t("Storage limit")}</div>
        <div className="text-right">{t("Actions")}</div>
      </TableRow>

      {planDefinitions.map((planDefinition) => (
        <PlanDefinitionRow
          key={planDefinition.id}
          planDefinition={planDefinition}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

function PlanDefinitionRow({
  planDefinition,
  onEdit,
  onRefresh,
}: {
  planDefinition: AdminApi.BillingPlanDefinition;
  onEdit: (planDefinition: AdminApi.BillingPlanDefinition) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const { mutateAsync: archive } = useArchiveBillingPlanDefinition();
  const { mutateAsync: unarchive } = useUnarchiveBillingPlanDefinition();
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const isArchived = Boolean(planDefinition.archivedAt);

  const handleArchive = async () => {
    await archiveBillingPlanDefinition(archive, planDefinition.id, onRefresh, () => setConfirmArchive(false));
  };

  const handleUnarchive = async () => {
    await unarchiveBillingPlanDefinition(unarchive, planDefinition.id, onRefresh);
  };

  return (
    <>
      <TableRow gridTemplateColumns="1.5fr 1fr 1fr 1.25fr 1fr 1fr 1.25fr 1.5fr 0.75fr">
        <div className="font-medium">{planDefinition.displayName}</div>
        <div className="text-sm font-mono text-content-dimmed">{planDefinition.key}</div>
        <div className="text-sm">{isArchived ? t("Archived") : t("Active")}</div>
        <div className="text-sm">{billingBehaviorLabel(planDefinition.billingBehavior)}</div>
        <div className="text-sm text-center">{planDefinition.customerSelectable ? t("Yes") : t("No")}</div>
        <div className="text-sm text-right">{formatInteger(planDefinition.tierRank)}</div>
        <div className="text-sm text-right">{formatLimit(planDefinition.memberLimit)}</div>
        <div className="text-sm text-right">{formatStorageLimit(planDefinition.storageLimitBytes)}</div>
        <div className="flex justify-end">
          <PlanDefinitionActionsMenu
            planDefinition={planDefinition}
            onEdit={onEdit}
            onArchive={() => setConfirmArchive(true)}
            onUnarchive={handleUnarchive}
            isArchived={isArchived}
          />
        </div>
      </TableRow>

      <ConfirmDialog
        isOpen={confirmArchive}
        title={t("Archive Plan")}
        message={t('Are you sure you want to archive "{{displayName}}"?', { displayName: planDefinition.displayName })}
        confirmText={t("Archive")}
        variant="danger"
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </>
  );
}

function PlanDefinitionActionsMenu({
  planDefinition,
  onEdit,
  onArchive,
  onUnarchive,
  isArchived,
}: {
  planDefinition: AdminApi.BillingPlanDefinition;
  onEdit: (planDefinition: AdminApi.BillingPlanDefinition) => void;
  onArchive: () => void;
  onUnarchive: () => void;
  isArchived: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Menu align="end" testId={`plan-definition-actions-${planDefinition.id}`}>
      <MenuActionItem icon={IconEdit} onClick={() => onEdit(planDefinition)}>
        {t("Edit plan")}
      </MenuActionItem>
      {isArchived ? (
        <MenuActionItem icon={IconRefresh} onClick={onUnarchive}>
          {t("Unarchive")}
        </MenuActionItem>
      ) : (
        planDefinition.key !== "free" && (
          <MenuActionItem icon={IconTrash} danger onClick={onArchive}>
            {t("Archive")}
          </MenuActionItem>
        )
      )}
    </Menu>
  );
}

function ProductRow({
  product,
  onEdit,
  onRefresh,
}: {
  product: AdminApi.BillingProduct;
  onEdit: (product: AdminApi.BillingProduct) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const { mutateAsync: archive } = useArchiveBillingProduct();
  const { mutateAsync: setActive } = useSetActiveBillingProduct();
  const [confirmArchive, setConfirmArchive] = React.useState(false);

  const handleArchive = async () => {
    await archiveBillingCatalogProduct(archive, product.id, onRefresh, () => setConfirmArchive(false));
  };

  const handleSetActive = async () => {
    await setActiveBillingCatalogProduct(setActive, product.id, onRefresh);
  };

  const isActive = product.active && !product.archivedAt;
  const price = formatPrice(product.priceAmount, product.priceCurrency);

  return (
    <>
      <TableRow gridTemplateColumns="2fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr">
        <div>
          <div className="font-medium">{product.polarProductName}</div>
        </div>
        <div className="text-sm">{product.provider}</div>
        <div className="text-sm capitalize">{product.planFamily}</div>
        <div className="text-sm capitalize">{product.billingInterval === "yearly" ? t("Yearly") : t("Monthly")}</div>
        <div className="text-sm text-right font-mono">{price}</div>
        <div className="flex justify-center">
          {isActive ? (
            <IconCircleCheckFilled size={18} className="text-green-500" />
          ) : (
            <IconCircleXFilled size={18} className="text-red-500" />
          )}
        </div>
        <div className="text-sm text-center text-content-dimmed">{formatDate(product.insertedAt)}</div>
        <div className="flex justify-end">
          <ProductActionsMenu
            product={product}
            onArchive={() => setConfirmArchive(true)}
            onSetActive={handleSetActive}
            onEdit={onEdit}
            isActive={isActive}
          />
        </div>
      </TableRow>

      <ConfirmDialog
        isOpen={confirmArchive}
        title={t("Archive Product")}
        message={t('Are you sure you want to archive "{{polarProductName}}"?', {
          polarProductName: product.polarProductName,
        })}
        confirmText={t("Archive")}
        variant="danger"
        onConfirm={handleArchive}
        onCancel={() => setConfirmArchive(false)}
      />
    </>
  );
}

function ProductActionsMenu({
  product,
  onArchive,
  onSetActive,
  onEdit,
  isActive,
}: {
  product: AdminApi.BillingProduct;
  onArchive: () => void;
  onSetActive: () => void;
  onEdit: (product: AdminApi.BillingProduct) => void;
  isActive: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Menu align="end" testId={`product-actions-${product.id}`}>
      <MenuActionItem icon={IconEdit} onClick={() => onEdit(product)}>
        {t("Edit product")}
      </MenuActionItem>
      {!isActive && !product.archivedAt && (
        <MenuActionItem icon={IconCheck} onClick={onSetActive}>
          {t("Set active")}
        </MenuActionItem>
      )}
      {!product.archivedAt && (
        <MenuActionItem icon={IconTrash} danger onClick={onArchive}>
          {t("Archive")}
        </MenuActionItem>
      )}
    </Menu>
  );
}

function TableRow({
  header,
  children,
  gridTemplateColumns,
}: {
  header?: boolean;
  children: React.ReactNode;
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
  });

  const style = { gridTemplateColumns };

  return <div className={className} style={style} children={children} />;
}

function formatPrice(amount: number, currency: string): string {
  const symbol = currency === "usd" ? "$" : currency.toUpperCase() + " ";
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

function formatLimit(limit?: number | null) {
  if (limit == null) return i18n.t("Unlimited");
  return formatInteger(limit);
}

function formatStorageLimit(limit?: number | null) {
  if (limit == null) return i18n.t("Unlimited");
  return formatStorageBytes(limit);
}

function billingBehaviorLabel(value: AdminApi.BillingBehavior) {
  return value === "internal" ? i18n.t("Internal") : i18n.t("Provider managed");
}

function formatInteger(value: number) {
  return new Intl.NumberFormat(undefined).format(value);
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
