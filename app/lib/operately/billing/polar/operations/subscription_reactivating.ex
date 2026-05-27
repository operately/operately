defmodule Operately.Billing.Polar.Operations.SubscriptionReactivating do
  alias Operately.Billing
  alias Operately.Billing.Overview
  alias Operately.Billing.Polar.SubscriptionState
  alias Operately.Companies.Company

  @doc """
  Clears a pending period-end cancellation on a live Polar subscription and
  returns the refreshed billing overview.
  """
  def run(%Company{} = company, opts \\ []) do
    client = provider_client(opts)

    with {:ok, %SubscriptionState{} = subscription_state} <- fetch_live_subscription(company, opts),
         {:ok, overview} <- reactivate_or_refresh(company, subscription_state, client, opts) do
      {:ok, overview}
    end
  end

  defp fetch_live_subscription(%Company{} = company, opts) do
    case SubscriptionState.fetch(company, opts) do
      {:ok, nil} ->
        {:error, :not_found}

      {:ok, %SubscriptionState{} = subscription_state} ->
        if SubscriptionState.live?(subscription_state) do
          {:ok, subscription_state}
        else
          {:error, :not_found}
        end

      {:error, _reason} = error ->
        error
    end
  end

  defp reactivate_or_refresh(%Company{} = company, %SubscriptionState{cancel_at_period_end: false}, _client, opts) do
    refreshed_overview(company, opts)
  end

  defp reactivate_or_refresh(%Company{}, %SubscriptionState{subscription_id: nil}, _client, _opts) do
    {:error, :internal_server_error}
  end

  defp reactivate_or_refresh(%Company{} = company, %SubscriptionState{} = subscription_state, client, opts) do
    with {:ok, _provider_subscription} <- client.update_subscription(subscription_state.subscription_id, %{cancel_at_period_end: false}),
         {:ok, overview} <- refreshed_overview(company, opts) do
      {:ok, overview}
    end
  end

  defp refreshed_overview(%Company{} = company, opts) do
    with {:ok, account} <- Billing.refresh_company_billing_state(company, opts) do
      {:ok, Overview.build(company, account, Billing.list_active_products())}
    end
  end

  defp provider_client(opts) do
    Billing.provider_client(opts)
  end
end
