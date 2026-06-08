defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.ProductCatalogEntry do
  alias Operately.Billing.Plans

  def serialize(product, level: :essential) do
    %{
      id: OperatelyWeb.Paths.billing_product_id(product),
      provider: product.provider,
      plan_family: Plans.atom_key(product.plan_family) || product.plan_family,
      billing_interval: product.billing_interval,
      polar_product_id: product.polar_product_id,
      polar_product_name: product.polar_product_name,
      price_amount: product.price_amount,
      price_currency: product.price_currency,
      version: product.version,
      active: product.active,
      archived_at: product.archived_at,
      last_synced_at: product.last_synced_at,
      inserted_at: product.inserted_at,
      updated_at: product.updated_at,
    }
  end
end
