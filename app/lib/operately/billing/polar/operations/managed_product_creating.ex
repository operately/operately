defmodule Operately.Billing.Polar.Operations.ManagedProductCreating do
  alias Operately.Billing
  alias Operately.Billing.Inputs
  alias Operately.Billing.Plans
  alias Operately.Billing.Polar.ProductMapper

  def run(attrs, opts \\ []) do
    with {:ok, plan_family} <- cast_plan_family(attrs[:plan_family] || attrs["plan_family"]),
         {:ok, billing_interval} <- cast_billing_interval(attrs[:billing_interval] || attrs["billing_interval"]),
         {:ok, plan_definition} <- load_plan_definition(plan_family) do
      version = Billing.next_product_version(plan_family, billing_interval)

      provider_attrs = %{
        polar_product_name: attrs[:polar_product_name] || attrs["polar_product_name"],
        plan_family: plan_family,
        billing_interval: billing_interval,
        price_amount: attrs[:price_amount] || attrs["price_amount"],
        price_currency: attrs[:price_currency] || attrs["price_currency"] || "usd",
        version: version,
        metadata: ProductMapper.metadata(plan_definition, billing_interval, version)
      }

      client = provider_client(opts)

      with {:ok, provider_product} <- client.create_product(provider_attrs),
           {:ok, normalized_product} <- normalize_provider_product(provider_product),
           {:ok, product} <- Billing.upsert_product_from_provider(normalized_product) do
        {:ok, product}
      end
    else
      {:error, :invalid_plan_family} -> {:error, :bad_request}
      {:error, :invalid_billing_interval} -> {:error, :bad_request}
      {:error, :plan_definition_not_found} -> {:error, :internal_server_error}
    end
  end

  defp cast_plan_family(plan_family) do
    case Inputs.cast_provider_managed_plan_key(plan_family) do
      {:ok, normalized_plan_key} -> {:ok, normalized_plan_key}
      {:error, :invalid_plan_key} -> {:error, :invalid_plan_family}
    end
  end

  defp cast_billing_interval(interval), do: Inputs.cast_billing_interval(interval)

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
