defmodule Operately.Billing.Polar.CheckoutSessionCreating do
  alias Operately.Billing
  alias Operately.Billing.CheckoutSession
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.ProductCatalogEntry
  alias Operately.Companies.Company
  alias OperatelyWeb.Paths

  @doc """
  Creates a new Polar checkout session for an unsubscribed company and records
  the requested plan as pending checkout state locally.
  """
  def run(%Company{} = company, plan_key, billing_interval, opts \\ []) do
    client = provider_client(opts)

    with {:ok, plan_key} <- cast_plan_key(plan_key),
         {:ok, billing_interval} <- cast_billing_interval(billing_interval),
         {:ok, %ProductCatalogEntry{} = product} <- find_target_product(plan_key, billing_interval),
         {:ok, %CompanyBillingAccount{} = account} <- Billing.refresh_company_billing_state(company, opts),
         :ok <- ensure_checkout_available(account),
         urls <- build_checkout_urls(company, client),
         {:ok, provider_session} <- create_provider_session(client, company, product, urls),
         {:ok, session} <- normalize_session(provider_session, urls),
         :ok <- persist_pending_checkout(company, plan_key, billing_interval) do
      {:ok, session}
    end
  end

  defp find_target_product(plan_key, billing_interval) do
    case Billing.find_active_product(plan_key, billing_interval) do
      %ProductCatalogEntry{} = product -> {:ok, product}
      nil -> {:error, :not_found}
    end
  end

  defp ensure_checkout_available(%CompanyBillingAccount{status: status}) when status in [:free, :canceled], do: :ok
  defp ensure_checkout_available(%CompanyBillingAccount{}), do: {:error, :bad_request}

  defp build_checkout_urls(%Company{} = company, client) do
    path = Paths.company_billing_path(company)
    base_url = String.trim_trailing(client.app_base_url(), "/")

    %{
      return_url: base_url <> path,
      success_url: base_url <> path <> "?checkout_id={CHECKOUT_ID}"
    }
  end

  defp create_provider_session(client, company, product, urls) do
    client.create_checkout_session(%{
      products: [product.polar_product_id],
      external_customer_id: to_string(company.id),
      success_url: urls.success_url,
      return_url: urls.return_url
    })
  end

  defp normalize_session(provider_session, urls) do
    id = Map.get(provider_session, "id")
    url = Map.get(provider_session, "url")
    return_url = Map.get(provider_session, "return_url") || Map.get(provider_session, "returnUrl") || urls.return_url
    success_url = Map.get(provider_session, "success_url") || Map.get(provider_session, "successUrl") || urls.success_url
    expires_at = Map.get(provider_session, "expires_at") || Map.get(provider_session, "expiresAt")

    with true <- is_binary(id),
         true <- is_binary(url),
         true <- is_binary(return_url),
         true <- is_binary(success_url),
         %DateTime{} = expires_at <- parse_datetime(expires_at) do
      {:ok,
       CheckoutSession.build(%{
         provider: "polar",
         id: id,
         url: url,
         return_url: return_url,
         success_url: success_url,
         expires_at: expires_at
       })}
    else
      _ -> {:error, :internal_server_error}
    end
  end

  defp persist_pending_checkout(%Company{} = company, plan_key, billing_interval) do
    with {:ok, account} <- Billing.get_or_create_billing_account(company),
         {:ok, _account} <- Billing.set_pending_checkout(account, plan_key, billing_interval) do
      :ok
    else
      {:error, _reason} -> {:error, :internal_server_error}
    end
  end

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> datetime
      _ -> nil
    end
  end

  defp parse_datetime(_), do: nil

  defp cast_plan_key(plan_key) when plan_key in [:team, :business], do: {:ok, plan_key}

  defp cast_plan_key(plan_key) when is_binary(plan_key) do
    case String.downcase(plan_key) do
      "team" -> {:ok, :team}
      "business" -> {:ok, :business}
      _ -> {:error, :bad_request}
    end
  end

  defp cast_plan_key(_), do: {:error, :bad_request}

  defp cast_billing_interval(interval) when interval in [:monthly, :yearly], do: {:ok, interval}

  defp cast_billing_interval(interval) when is_binary(interval) do
    case String.downcase(interval) do
      "monthly" -> {:ok, :monthly}
      "yearly" -> {:ok, :yearly}
      _ -> {:error, :bad_request}
    end
  end

  defp cast_billing_interval(_), do: {:error, :bad_request}

  defp provider_client(opts) do
    Keyword.get(opts, :client, Operately.Billing.Polar.Client)
  end
end
