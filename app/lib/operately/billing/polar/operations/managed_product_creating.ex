defmodule Operately.Billing.Polar.Operations.ManagedProductCreating do
  alias Operately.Billing
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.Polar.ProductMapper

  @valid_plan_keys CompanyBillingAccount.valid_plan_keys()
  @valid_billing_intervals CompanyBillingAccount.valid_billing_intervals()

  def run(attrs, opts \\ []) do
    with {:ok, plan_family} <- cast_plan_family(attrs[:plan_family] || attrs["plan_family"]),
         {:ok, billing_interval} <- cast_billing_interval(attrs[:billing_interval] || attrs["billing_interval"]) do
      version = Billing.next_product_version(plan_family, billing_interval)

      provider_attrs = %{
        polar_product_name: attrs[:polar_product_name] || attrs["polar_product_name"],
        plan_family: plan_family,
        billing_interval: billing_interval,
        price_amount: attrs[:price_amount] || attrs["price_amount"],
        price_currency: attrs[:price_currency] || attrs["price_currency"] || "usd",
        version: version
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
    end
  end

  defp cast_plan_family(plan_family) when plan_family in @valid_plan_keys, do: {:ok, plan_family}

  defp cast_plan_family(plan_family) when is_binary(plan_family) do
    case String.downcase(plan_family) do
      "team" -> {:ok, :team}
      "business" -> {:ok, :business}
      _ -> {:error, :invalid_plan_family}
    end
  end

  defp cast_plan_family(_), do: {:error, :invalid_plan_family}

  defp cast_billing_interval(interval) when interval in @valid_billing_intervals, do: {:ok, interval}

  defp cast_billing_interval(interval) when is_binary(interval) do
    case String.downcase(interval) do
      "monthly" -> {:ok, :monthly}
      "yearly" -> {:ok, :yearly}
      _ -> {:error, :invalid_billing_interval}
    end
  end

  defp cast_billing_interval(_), do: {:error, :invalid_billing_interval}

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
