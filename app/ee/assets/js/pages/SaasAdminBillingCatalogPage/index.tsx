import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";
import { redirect } from "react-router-dom";

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

export const loader = async () => {
  if (!window.appConfig.billingEnabled) {
    throw redirect("/admin");
  }

  const [productsData, planDefinitionsData] = await Promise.all([
    AdminApi.listBillingProducts({}),
    AdminApi.listBillingPlanDefinitions({}),
  ]);

  return {
    products: productsData.products ?? [],
    planDefinitions: planDefinitionsData.planDefinitions ?? [],
  };
};

export function Page() {
  const { products, planDefinitions } = Pages.useLoadedData() as {
    products: AdminApi.BillingProduct[];
    planDefinitions: AdminApi.BillingPlanDefinition[];
  };
  const tabs = useTabs("products", [
    { id: "products", label: "Products", icon: <IconBuilding size={16} /> },
    { id: "plans", label: "Plans", icon: <IconSettings size={16} /> },
  ]);
  const refresh = Pages.useRefresh();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<AdminApi.BillingProduct | undefined>(undefined);
  const [isPlanModalOpen, setIsPlanModalOpen] = React.useState(false);
  const [editingPlanDefinition, setEditingPlanDefinition] = React.useState<AdminApi.BillingPlanDefinition | undefined>(undefined);

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

  const closePlanModal = () => {
    setIsPlanModalOpen(false);
    setEditingPlanDefinition(undefined);
  };

  return (
    <Pages.Page title="Billing Catalog" testId="saas-admin-billing-catalog-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <PageHeader activeTab={tabs.active} onCreate={openCreate} onRefresh={refresh} />
          <div className="-mx-4 -mb-px">
            <Tabs tabs={tabs} />
          </div>
          {tabs.active === "plans" ? (
            <PlanDefinitionTable planDefinitions={planDefinitions} onEdit={openPlanEdit} />
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
          <ProductModal key={editingProduct?.id ?? "new"} isOpen={isModalOpen} onClose={closeModal} onSuccess={refresh} product={editingProduct} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageHeader({ activeTab, onCreate, onRefresh }: { activeTab: string; onCreate: () => void; onRefresh: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Paper.Header title="Billing Catalog" />
      {activeTab === "products" && (
        <div className="flex items-center gap-3">
          <button
            onClick={onCreate}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-dimmed hover:bg-surface-highlight rounded border border-stroke-base transition-colors"
          >
            <IconPlus size={16} />
            Create product
          </button>
          <SyncButton onRefresh={onRefresh} />
        </div>
      )}
    </div>
  );
}

function SyncButton({ onRefresh }: { onRefresh: () => void }) {
  const [sync, { loading }] = AdminApi.useSyncBillingProductsFromPolar();

  const handleSync = async () => {
    await syncBillingCatalogProducts(sync, onRefresh);
  };

  return (
    <Tooltip
      content="Imports and reconciles Operately-managed Polar products. Unrelated manual Polar products are ignored."
      size="sm"
    >
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-dimmed hover:bg-surface-highlight rounded border border-stroke-base transition-colors"
      >
        <IconRefresh size={16} className={classNames({ "animate-spin": loading })} />
        Sync from Polar
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
  return (
    <div className="mt-6">
      <TableRow header gridTemplateColumns="2fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr">
        <div>Product</div>
        <div>Provider</div>
        <div>Plan Family</div>
        <div>Interval</div>
        <div className="text-right">Price</div>
        <div className="text-center">Status</div>
        <div className="text-center">Created</div>
        <div className="text-right">Actions</div>
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
}: {
  planDefinitions: AdminApi.BillingPlanDefinition[];
  onEdit: (planDefinition: AdminApi.BillingPlanDefinition) => void;
}) {
  return (
    <div className="mt-6">
      <TableRow header gridTemplateColumns="1.75fr 1fr 1fr 1.25fr 1.5fr 0.75fr">
        <div>Plan</div>
        <div>Key</div>
        <div className="text-right">Sort order</div>
        <div className="text-right">Member limit</div>
        <div className="text-right">Storage limit</div>
        <div className="text-right">Actions</div>
      </TableRow>

      {planDefinitions.map((planDefinition) => (
        <PlanDefinitionRow key={planDefinition.id} planDefinition={planDefinition} onEdit={onEdit} />
      ))}
    </div>
  );
}

function PlanDefinitionRow({
  planDefinition,
  onEdit,
}: {
  planDefinition: AdminApi.BillingPlanDefinition;
  onEdit: (planDefinition: AdminApi.BillingPlanDefinition) => void;
}) {
  return (
    <TableRow gridTemplateColumns="1.75fr 1fr 1fr 1.25fr 1.5fr 0.75fr">
      <div className="font-medium">{planDefinition.displayName}</div>
      <div className="text-sm font-mono text-content-dimmed">{planDefinition.key}</div>
      <div className="text-sm text-right">{formatInteger(planDefinition.sortOrder)}</div>
      <div className="text-sm text-right">{formatLimit(planDefinition.memberLimit)}</div>
      <div className="text-sm text-right">{formatStorageLimit(planDefinition.storageLimitBytes)}</div>
      <div className="flex justify-end">
        <PlanDefinitionActionsMenu planDefinition={planDefinition} onEdit={onEdit} />
      </div>
    </TableRow>
  );
}

function PlanDefinitionActionsMenu({
  planDefinition,
  onEdit,
}: {
  planDefinition: AdminApi.BillingPlanDefinition;
  onEdit: (planDefinition: AdminApi.BillingPlanDefinition) => void;
}) {
  return (
    <Menu align="end" testId={`plan-definition-actions-${planDefinition.id}`}>
      <MenuActionItem icon={IconEdit} onClick={() => onEdit(planDefinition)}>
        Edit plan
      </MenuActionItem>
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
  const [archive] = AdminApi.useArchiveBillingProduct();
  const [setActive] = AdminApi.useSetActiveBillingProduct();
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
        <div className="text-sm capitalize">{product.billingInterval}</div>
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
        title="Archive Product"
        message={`Are you sure you want to archive "${product.polarProductName}"?`}
        confirmText="Archive"
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
  return (
    <Menu align="end" testId={`product-actions-${product.id}`}>
      <MenuActionItem icon={IconEdit} onClick={() => onEdit(product)}>
        Edit product
      </MenuActionItem>
      {!isActive && !product.archivedAt && (
        <MenuActionItem icon={IconCheck} onClick={onSetActive}>
          Set active
        </MenuActionItem>
      )}
      {!product.archivedAt && (
        <MenuActionItem icon={IconTrash} danger onClick={onArchive}>
          Archive
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
  if (limit == null) return "Unlimited";
  return formatInteger(limit);
}

function formatStorageLimit(limit?: number | null) {
  if (limit == null) return "Unlimited";
  return formatStorageBytes(limit);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat(undefined).format(value);
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
