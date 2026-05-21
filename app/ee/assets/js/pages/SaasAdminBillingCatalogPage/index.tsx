import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";
import { redirect } from "react-router-dom";

import classNames from "classnames";
import {
  ConfirmDialog,
  IconCheck,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconTrash,
  Menu,
  MenuActionItem,
  Tooltip,
} from "turboui";

import { ProductModal } from "./ProductModal";

export const loader = async () => {
  if (!window.appConfig.billingEnabled) {
    throw redirect("/admin");
  }

  const data = await AdminApi.listBillingProducts({});
  return { products: data.products ?? [] };
};

export function Page() {
  const { products } = Pages.useLoadedData() as { products: AdminApi.BillingProduct[] };
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<AdminApi.BillingProduct | undefined>(undefined);

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

  return (
    <Pages.Page title="Billing Catalog" testId="saas-admin-billing-catalog-page">
      <Paper.Root size="xlarge">
        <Paper.Body>
          <PageHeader onCreate={openCreate} />
          <ProductTable products={products} onEdit={openEdit} />
          <ProductModal isOpen={isModalOpen} onClose={closeModal} product={editingProduct} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Paper.Header title="Billing Catalog" />
      <div className="flex items-center gap-3">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-surface-dimmed hover:bg-surface-highlight rounded border border-stroke-base transition-colors"
        >
          <IconPlus size={16} />
          Create Product
        </button>
        <SyncButton />
      </div>
    </div>
  );
}

function SyncButton() {
  const [sync, { loading }] = AdminApi.useSyncBillingProductsFromPolar();

  const handleSync = async () => {
    await sync({});
    window.location.reload();
  };

  return (
    <Tooltip content="Fetches products from Polar and updates the local catalog" size="sm">
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
}: {
  products: AdminApi.BillingProduct[];
  onEdit: (product: AdminApi.BillingProduct) => void;
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
        <ProductRow key={product.id} product={product} onEdit={onEdit} />
      ))}
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
}: {
  product: AdminApi.BillingProduct;
  onEdit: (product: AdminApi.BillingProduct) => void;
}) {
  const [archive] = AdminApi.useArchiveBillingProduct();
  const [setActive] = AdminApi.useSetActiveBillingProduct();
  const [confirmArchive, setConfirmArchive] = React.useState(false);

  const handleArchive = async () => {
    await archive({ id: product.id });
    setConfirmArchive(false);
    window.location.reload();
  };

  const handleSetActive = async () => {
    await setActive({ id: product.id });
    window.location.reload();
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
        Edit
      </MenuActionItem>
      {!isActive && (
        <MenuActionItem icon={IconCheck} onClick={onSetActive}>
          Set as Active
        </MenuActionItem>
      )}
      <MenuActionItem icon={IconTrash} danger onClick={onArchive}>
        Archive
      </MenuActionItem>
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

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
