defmodule Operately.Billing.Polar.Operations.CustomerStateSync do
  @moduledoc false

  require Logger

  alias Operately.Billing
  alias Operately.Billing.Polar.SubscriptionState

  @doc """
  Fetches a company's billing state from Polar and syncs it locally.

  A missing Polar customer is normalized to Operately's local free state.
  """
  def run(%Operately.Companies.Company{} = company, opts \\ []) do
    case SubscriptionState.fetch(company, opts) do
      {:ok, %SubscriptionState{} = subscription_state} ->
        subscription_state
        |> normalize_subscription_state(company)
        |> then(&Billing.sync_billing_account(company, &1))

      {:ok, nil} ->
        company
        |> normalize_free_state()
        |> then(&Billing.sync_billing_account(company, &1))

      {:error, :not_found} ->
        company
        |> normalize_free_state()
        |> then(&Billing.sync_billing_account(company, &1))

      {:error, _reason} = error ->
        error
    end
  end

  defp normalize_subscription_state(%SubscriptionState{} = subscription_state, company) do
    maybe_log_missing_current_product(subscription_state, company)
    maybe_log_missing_scheduled_product(subscription_state, company)

    %{
      provider: "polar",
      plan_key: subscription_state.product && subscription_state.product.plan_family,
      billing_interval: subscription_state.product && subscription_state.product.billing_interval,
      status: subscription_state.status,
      cancel_at_period_end: subscription_state.cancel_at_period_end,
      current_period_end: subscription_state.current_period_end,
      scheduled_plan_key: subscription_state.pending_update_product && subscription_state.pending_update_product.plan_family,
      scheduled_billing_interval: subscription_state.pending_update_product && subscription_state.pending_update_product.billing_interval,
      scheduled_change_effective_at: scheduled_change_effective_at(subscription_state),
      last_synced_at: DateTime.utc_now()
    }
  end

  defp normalize_free_state(_company) do
    %{
      provider: "polar",
      plan_key: nil,
      billing_interval: nil,
      status: :free,
      cancel_at_period_end: false,
      current_period_end: nil,
      scheduled_plan_key: nil,
      scheduled_billing_interval: nil,
      scheduled_change_effective_at: nil,
      last_synced_at: DateTime.utc_now()
    }
  end

  defp scheduled_change_effective_at(%SubscriptionState{pending_update_product: nil}), do: nil
  defp scheduled_change_effective_at(%SubscriptionState{} = subscription_state), do: subscription_state.current_period_end

  defp maybe_log_missing_current_product(%SubscriptionState{product_id: nil}, _company), do: :ok
  defp maybe_log_missing_current_product(%SubscriptionState{product: %_{}}, _company), do: :ok

  defp maybe_log_missing_current_product(%SubscriptionState{} = subscription_state, company) do
    Logger.warning(
      "Polar subscription product is missing from local billing catalog: " <>
        inspect(%{company_id: company.id, product_id: subscription_state.product_id})
    )
  end

  defp maybe_log_missing_scheduled_product(%SubscriptionState{pending_update_product_id: nil}, _company), do: :ok
  defp maybe_log_missing_scheduled_product(%SubscriptionState{pending_update_product: %_{}}, _company), do: :ok

  defp maybe_log_missing_scheduled_product(%SubscriptionState{} = subscription_state, company) do
    Logger.warning(
      "Polar pending subscription update product is missing from local billing catalog: " <>
        inspect(%{company_id: company.id, product_id: subscription_state.pending_update_product_id})
    )
  end
end
