defmodule Operately.Billing.Polar.Operations.CustomerSessionCreating do
  alias Operately.Billing
  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.HostedSession
  alias Operately.Companies.Company
  alias OperatelyWeb.Paths

  def run_payment_method(%Company{} = company, opts \\ []) do
    run(company, opts)
  end

  def run_portal(%Company{} = company, opts \\ []) do
    run(company, opts)
  end

  defp run(%Company{} = company, opts) do
    client = provider_client(opts)

    with {:ok, return_url} <- build_return_url(company, client, opts),
         {:ok, %CompanyBillingAccount{} = account} <- Billing.refresh_company_billing_state(company, opts),
         :ok <- ensure_hosted_session_available(account),
         {:ok, provider_session} <- client.create_customer_session(to_string(company.id), return_url),
         {:ok, session} <- normalize_session(provider_session, return_url) do
      {:ok, session}
    end
  end

  defp ensure_hosted_session_available(%CompanyBillingAccount{status: :free}), do: {:error, :not_found}
  defp ensure_hosted_session_available(_account), do: :ok

  defp normalize_session(provider_session, fallback_return_url) do
    url = Map.get(provider_session, "customer_portal_url") || Map.get(provider_session, "customerPortalUrl")
    expires_at = Map.get(provider_session, "expires_at") || Map.get(provider_session, "expiresAt")
    return_url = Map.get(provider_session, "return_url") || Map.get(provider_session, "returnUrl") || fallback_return_url

    if is_binary(url) and is_binary(return_url) do
      {:ok,
       HostedSession.build(%{
         provider: "polar",
         url: url,
         return_url: return_url,
         expires_at: parse_datetime(expires_at)
       })}
    else
      {:error, :internal_server_error}
    end
  end

  defp parse_datetime(nil), do: nil

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} -> datetime
      _ -> nil
    end
  end

  defp parse_datetime(_), do: nil

  defp build_return_url(%Company{} = company, client, opts) do
    with {:ok, path} <- return_path(company, opts) do
      {:ok, String.trim_trailing(client.app_base_url(), "/") <> path}
    end
  end

  defp return_path(%Company{} = company, opts) do
    case Keyword.get(opts, :return_to) do
      nil -> {:ok, Paths.company_admin_path(company)}
      path when is_binary(path) -> validate_return_path(path)
      _ -> {:error, :bad_request}
    end
  end

  defp validate_return_path(path) do
    path = String.trim(path)
    uri = URI.parse(path)

    cond do
      path == "" -> {:error, :bad_request}
      uri.scheme != nil -> {:error, :bad_request}
      uri.host != nil -> {:error, :bad_request}
      !String.starts_with?(path, "/") -> {:error, :bad_request}
      String.starts_with?(path, "//") -> {:error, :bad_request}
      true -> {:ok, path}
    end
  end

  defp provider_client(opts) do
    Keyword.get(opts, :client, Operately.Billing.Polar.Client)
  end
end
