defmodule Operately.Billing.Polar.CustomerStateSync do
  @moduledoc false

  require Logger

  alias Operately.Billing

  @doc """
  Fetches a company's billing state from Polar and syncs it locally.

  A missing Polar customer is normalized to Operately's local free state.
  """
  def run(%Operately.Companies.Company{} = company, opts \\ []) do
    client = Keyword.get(opts, :client, Operately.Billing.Polar.Client)

    case client.get_customer_state_by_external_id(company.id) do
      {:ok, customer_state} ->
        customer_state
        |> normalize_customer_state(company)
        |> then(&Billing.sync_billing_account(company, &1))

      {:error, :not_found} ->
        company
        |> normalize_free_state()
        |> then(&Billing.sync_billing_account(company, &1))

      {:error, _reason} = error ->
        error
    end
  end

  defp normalize_customer_state(customer_state, company) do
    case find_relevant_subscription(customer_state) do
      nil ->
        normalize_free_state(company)

      subscription ->
        product = find_local_product(subscription)

        if is_nil(product) do
          Logger.warning(
            "Polar subscription product is missing from local billing catalog: " <>
              inspect(%{company_id: company.id, product_id: extract_product_id(subscription)})
          )
        end

        %{
          provider: "polar",
          plan_key: product && product.plan_family,
          billing_interval: product && product.billing_interval,
          status: normalize_subscription_status(subscription),
          cancel_at_period_end: extract_cancel_at_period_end(subscription),
          current_period_end: extract_current_period_end(subscription),
          last_synced_at: DateTime.utc_now()
        }
    end
  end

  defp normalize_free_state(_company) do
    %{
      provider: "polar",
      plan_key: nil,
      billing_interval: nil,
      status: :free,
      cancel_at_period_end: false,
      current_period_end: nil,
      last_synced_at: DateTime.utc_now()
    }
  end

  defp find_local_product(subscription) do
    case extract_product_id(subscription) do
      nil -> nil
      product_id -> Billing.get_product_by_polar_product_id(product_id)
    end
  end

  defp extract_product_id(subscription) do
    Map.get(subscription, "product_id") ||
      Map.get(subscription, "productId") ||
      get_in(subscription, ["product", "id"])
  end

  defp find_relevant_subscription(customer_state) do
    active_subscription(customer_state) ||
      subscriptions(customer_state)
      |> Enum.find(&paid_status?/1)
  end

  defp active_subscription(customer_state) do
    Map.get(customer_state, "active_subscription") ||
      Map.get(customer_state, "activeSubscription") ||
      subscriptions(customer_state)
      |> Enum.find(&active_status?/1)
  end

  defp subscriptions(customer_state) do
    cond do
      is_list(Map.get(customer_state, "active_subscriptions")) ->
        Map.get(customer_state, "active_subscriptions")

      is_list(Map.get(customer_state, "activeSubscriptions")) ->
        Map.get(customer_state, "activeSubscriptions")

      is_list(Map.get(customer_state, "subscriptions")) ->
        Map.get(customer_state, "subscriptions")

      true ->
        []
    end
  end

  defp normalize_subscription_status(subscription) do
    case String.downcase(extract_subscription_status(subscription) || "active") do
      "active" -> :active
      "trialing" -> :active
      "past_due" -> :past_due
      "canceled" -> :canceled
      _ -> :active
    end
  end

  defp active_status?(subscription) do
    extract_subscription_status(subscription)
    |> case do
      nil -> false
      status -> String.downcase(status) in ["active", "trialing", "past_due"]
    end
  end

  defp paid_status?(subscription) do
    extract_subscription_status(subscription)
    |> case do
      nil -> false
      status -> String.downcase(status) in ["active", "trialing", "past_due", "canceled"]
    end
  end

  defp extract_subscription_status(subscription) do
    Map.get(subscription, "status") ||
      Map.get(subscription, "subscription_status") ||
      Map.get(subscription, "subscriptionStatus")
  end

  defp extract_cancel_at_period_end(subscription) do
    value =
      Map.get(subscription, "cancel_at_period_end") ||
        Map.get(subscription, "cancelAtPeriodEnd")

    value in [true, "true", 1, "1"]
  end

  defp extract_current_period_end(subscription) do
    subscription
    |> then(fn subscription ->
      Map.get(subscription, "current_period_end") ||
        Map.get(subscription, "currentPeriodEnd") ||
        Map.get(subscription, "current_period_end_at")
    end)
    |> parse_datetime()
  end

  defp parse_datetime(nil), do: nil
  defp parse_datetime(%DateTime{} = datetime), do: datetime

  defp parse_datetime(value) when is_binary(value) do
    case DateTime.from_iso8601(value) do
      {:ok, datetime, _offset} ->
        datetime

      _ ->
        case NaiveDateTime.from_iso8601(value) do
          {:ok, naive_datetime} -> DateTime.from_naive!(naive_datetime, "Etc/UTC")
          _ -> nil
        end
    end
  end

  defp parse_datetime(_), do: nil
end
