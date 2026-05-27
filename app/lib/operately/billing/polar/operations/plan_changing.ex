defmodule Operately.Billing.Polar.Operations.PlanChanging do
  require Logger

  alias Operately.Billing
  alias Operately.Billing.Overview
  alias Operately.Billing.Polar.SubscriptionState
  alias Operately.Billing.ProductCatalogEntry
  alias Operately.Companies.Company

  @doc """
  Changes a live paid subscription to another active catalog product and returns
  the refreshed billing overview.
  """
  def run(%Company{} = company, plan_key, billing_interval, opts \\ []) do
    client = provider_client(opts)

    with {:ok, plan_key} <- cast_plan_key(plan_key),
         {:ok, billing_interval} <- cast_billing_interval(billing_interval),
         {:ok, %ProductCatalogEntry{} = target_product} <- find_target_product(plan_key, billing_interval),
         {:ok, %SubscriptionState{} = subscription_state} <- fetch_live_subscription(company, opts),
         :ok <- ensure_current_product(subscription_state),
         :ok <- ensure_change_supported(subscription_state, plan_key, billing_interval),
         {:ok, _provider_subscription} <- apply_change(subscription_state, target_product, client),
         {:ok, overview} <- refreshed_overview(company, opts) do
      {:ok, overview}
    end
  end

  defp fetch_live_subscription(%Company{} = company, opts) do
    case SubscriptionState.fetch(company, opts) do
      {:ok, nil} ->
        {:error, :not_found}

      {:ok, %SubscriptionState{} = subscription_state} ->
        cond do
          SubscriptionState.raw_trialing?(subscription_state) -> {:error, :bad_request}
          SubscriptionState.live?(subscription_state) -> {:ok, subscription_state}
          true -> {:error, :not_found}
        end

      {:error, _reason} = error ->
        error
    end
  end

  defp ensure_current_product(%SubscriptionState{subscription_id: nil}), do: {:error, :internal_server_error}
  defp ensure_current_product(%SubscriptionState{product: nil}), do: {:error, :internal_server_error}
  defp ensure_current_product(%SubscriptionState{}), do: :ok

  defp ensure_change_supported(%SubscriptionState{} = subscription_state, plan_key, billing_interval) do
    if subscription_state.product.plan_family == plan_key and subscription_state.product.billing_interval == billing_interval do
      {:error, :bad_request}
    else
      :ok
    end
  end

  defp find_target_product(plan_key, billing_interval) do
    case Billing.find_active_product(plan_key, billing_interval) do
      %ProductCatalogEntry{} = product -> {:ok, product}
      nil -> {:error, :not_found}
    end
  end

  defp apply_change(%SubscriptionState{} = subscription_state, %ProductCatalogEntry{} = target_product, client) do
    with {:ok, subscription_state, should_restore_cancellation?} <- maybe_reactivate_before_change(subscription_state, client),
         {:ok, provider_subscription} <- update_plan(subscription_state, target_product, client, should_restore_cancellation?) do
      {:ok, provider_subscription}
    end
  end

  defp maybe_reactivate_before_change(%SubscriptionState{subscription_id: nil}, _client), do: {:error, :internal_server_error}

  defp maybe_reactivate_before_change(%SubscriptionState{cancel_at_period_end: false} = subscription_state, _client) do
    {:ok, subscription_state, false}
  end

  defp maybe_reactivate_before_change(%SubscriptionState{} = subscription_state, client) do
    case client.update_subscription(subscription_state.subscription_id, %{cancel_at_period_end: false}) do
      {:ok, _provider_subscription} ->
        {:ok, %{subscription_state | cancel_at_period_end: false}, true}

      {:error, _reason} = error ->
        error
    end
  end

  defp update_plan(%SubscriptionState{} = subscription_state, %ProductCatalogEntry{} = target_product, client, should_restore_cancellation?) do
    payload = %{
      product_id: target_product.polar_product_id,
      proration_behavior: proration_behavior(subscription_state.product, target_product)
    }

    case client.update_subscription(subscription_state.subscription_id, payload) do
      {:ok, provider_subscription} ->
        {:ok, provider_subscription}

      {:error, _reason} = error ->
        maybe_restore_cancellation(subscription_state.subscription_id, client, should_restore_cancellation?)
        error
    end
  end

  defp maybe_restore_cancellation(_subscription_id, _client, false), do: :ok

  defp maybe_restore_cancellation(subscription_id, client, true) do
    case client.update_subscription(subscription_id, %{cancel_at_period_end: true}) do
      {:ok, _provider_subscription} ->
        :ok

      {:error, reason} ->
        Logger.warning("Failed to restore pending Polar cancellation after plan-change error: #{inspect(%{subscription_id: subscription_id, reason: reason})}")
        :ok
    end
  end

  defp proration_behavior(current_product, target_product) do
    cond do
      plan_tier(target_product.plan_family) > plan_tier(current_product.plan_family) -> "prorate"
      plan_tier(target_product.plan_family) < plan_tier(current_product.plan_family) -> "next_period"
      target_product.billing_interval != current_product.billing_interval -> "next_period"
      true -> "prorate"
    end
  end

  defp plan_tier(:team), do: 1
  defp plan_tier(:business), do: 2
  defp plan_tier(_), do: 0

  defp refreshed_overview(%Company{} = company, opts) do
    with {:ok, account} <- Billing.refresh_company_billing_state(company, opts) do
      {:ok, Overview.build(company, account, Billing.list_active_products())}
    end
  end

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
    Billing.provider_client(opts)
  end
end
