defmodule Operately.Billing.Polar.Operations.ManagedProductUpdating do
  alias Operately.Billing
  alias Operately.Billing.Polar.ProductMapper
  alias Operately.Billing.ProductCatalogEntry

  def run(%ProductCatalogEntry{} = entry, attrs, opts \\ []) do
    client = provider_client(opts)

    provider_attrs = %{
      polar_product_name: attrs[:polar_product_name] || attrs["polar_product_name"] || entry.polar_product_name,
      plan_family: entry.plan_family,
      billing_interval: entry.billing_interval,
      price_amount: attrs[:price_amount] || attrs["price_amount"] || entry.price_amount,
      price_currency: attrs[:price_currency] || attrs["price_currency"] || entry.price_currency || "usd",
      version: entry.version
    }

    with {:ok, provider_product} <- client.update_product(entry.polar_product_id, provider_attrs),
         {:ok, normalized_product} <- normalize_provider_product(provider_product),
         {:ok, product} <- Billing.upsert_product_from_provider(normalized_product) do
      {:ok, product}
    end
  end

  defp normalize_provider_product(provider_product) do
    case ProductMapper.normalize_provider_product(provider_product) do
      {:ok, product} -> {:ok, product}
      :ignore -> {:error, :internal_server_error}
    end
  end

  defp provider_client(opts) do
    Keyword.get(opts, :client, Operately.Billing.Polar.Client)
  end
end
