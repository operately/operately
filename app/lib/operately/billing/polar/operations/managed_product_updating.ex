defmodule Operately.Billing.Polar.Operations.ManagedProductUpdating do
  alias Operately.Billing
  alias Operately.Billing.Plans
  alias Operately.Billing.Polar.ProductMapper
  alias Operately.Billing.ProductCatalogEntry

  def run(%ProductCatalogEntry{} = entry, attrs, opts \\ []) do
    client = provider_client(opts)

    with {:ok, plan_definition} <- load_plan_definition(entry.plan_family),
         {:ok, provider_product} <- client.update_product(entry.polar_product_id, provider_attrs(entry, attrs, plan_definition)),
         {:ok, normalized_product} <- normalize_provider_product(provider_product),
         {:ok, product} <- Billing.upsert_product_from_provider(normalized_product) do
      {:ok, product}
    else
      {:error, :plan_definition_not_found} -> {:error, :internal_server_error}
    end
  end

  defp provider_attrs(entry, attrs, plan_definition) do
    %{
      polar_product_name: attrs[:polar_product_name] || attrs["polar_product_name"] || entry.polar_product_name,
      plan_family: entry.plan_family,
      billing_interval: entry.billing_interval,
      price_amount: attrs[:price_amount] || attrs["price_amount"] || entry.price_amount,
      price_currency: attrs[:price_currency] || attrs["price_currency"] || entry.price_currency || "usd",
      version: entry.version,
      metadata: ProductMapper.metadata(plan_definition, entry.billing_interval, entry.version)
    }
  end

  defp load_plan_definition(plan_family) do
    case Plans.get(plan_family) do
      nil -> {:error, :plan_definition_not_found}
      plan_definition -> {:ok, plan_definition}
    end
  end

  defp normalize_provider_product(provider_product) do
    case ProductMapper.normalize_provider_product(provider_product) do
      {:ok, normalized} -> {:ok, normalized.product_attrs}
      :ignore -> {:error, :internal_server_error}
    end
  end

  defp provider_client(opts) do
    Billing.provider_client(opts)
  end
end
