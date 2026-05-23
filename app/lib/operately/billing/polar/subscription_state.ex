defmodule Operately.Billing.Polar.SubscriptionState do
  @moduledoc false

  alias Operately.Billing
  alias Operately.Companies.Company

  @enforce_keys [
    :subscription_id,
    :raw_status,
    :status,
    :product_id,
    :product,
    :cancel_at_period_end,
    :current_period_end,
    :pending_update_product_id,
    :pending_update_product
  ]
  defstruct [
    :subscription_id,
    :raw_status,
    :status,
    :product_id,
    :product,
    :cancel_at_period_end,
    :current_period_end,
    :pending_update_product_id,
    :pending_update_product
  ]

  def fetch(%Company{} = company, opts \\ []) do
    client = Keyword.get(opts, :client, Operately.Billing.Polar.Client)

    case client.get_customer_state_by_external_id(company.id) do
      {:ok, customer_state} ->
        case find_relevant_subscription(customer_state) do
          nil -> {:ok, nil}
          subscription -> {:ok, build(subscription)}
        end

      {:error, _reason} = error ->
        error
    end
  end

  def build(subscription) when is_map(subscription) do
    product_id = extract_product_id(subscription)
    pending_update_product_id = extract_pending_update_product_id(subscription)

    %__MODULE__{
      subscription_id: extract_subscription_id(subscription),
      raw_status: extract_subscription_status(subscription),
      status: normalize_subscription_status(subscription),
      product_id: product_id,
      product: find_local_product(product_id),
      cancel_at_period_end: extract_cancel_at_period_end(subscription),
      current_period_end: extract_current_period_end(subscription),
      pending_update_product_id: pending_update_product_id,
      pending_update_product: find_local_product(pending_update_product_id)
    }
  end

  def paid?(%__MODULE__{status: status}), do: status in [:active, :past_due, :canceled]
  def live?(%__MODULE__{status: status}), do: status in [:active, :past_due]
  def raw_trialing?(%__MODULE__{raw_status: status}) when is_binary(status), do: String.downcase(status) == "trialing"
  def raw_trialing?(%__MODULE__{}), do: false

  def find_relevant_subscription(customer_state) do
    active_subscription(customer_state) ||
      customer_state
      |> subscriptions()
      |> Enum.find(&paid_status?/1)
  end

  defp active_subscription(customer_state) do
    Map.get(customer_state, "active_subscription") ||
      Map.get(customer_state, "activeSubscription") ||
      customer_state
      |> subscriptions()
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

  defp find_local_product(nil), do: nil

  defp find_local_product(product_id) when is_binary(product_id) do
    Billing.get_product_by_polar_product_id(product_id)
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

  defp extract_subscription_id(subscription) do
    Map.get(subscription, "id") ||
      Map.get(subscription, "subscription_id") ||
      Map.get(subscription, "subscriptionId")
  end

  defp extract_subscription_status(subscription) do
    Map.get(subscription, "status") ||
      Map.get(subscription, "subscription_status") ||
      Map.get(subscription, "subscriptionStatus")
  end

  defp extract_product_id(subscription) do
    Map.get(subscription, "product_id") ||
      Map.get(subscription, "productId") ||
      get_in(subscription, ["product", "id"])
  end

  defp extract_pending_update_product_id(subscription) do
    pending_update =
      Map.get(subscription, "pending_update") ||
        Map.get(subscription, "pendingUpdate")

    case pending_update do
      %{} = pending_update ->
        Map.get(pending_update, "product_id") ||
          Map.get(pending_update, "productId") ||
          get_in(pending_update, ["product", "id"])

      _ ->
        nil
    end
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
