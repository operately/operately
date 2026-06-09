defmodule Operately.Billing.Inputs do
  @moduledoc """
  Shared casting and normalization for billing-related external inputs.

  Higher-level billing flows should delegate raw plan and interval parsing here,
  then map the shared result to their own policy-specific error handling.
  """

  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.Plans

  @valid_billing_intervals CompanyBillingAccount.valid_billing_intervals()

  def cast_existing_plan_key(plan_key), do: Plans.cast_existing_plan_key(plan_key)
  def cast_customer_selectable_plan_key(plan_key), do: Plans.cast_customer_selectable_plan_key(plan_key)
  def cast_provider_managed_plan_key(plan_key), do: Plans.cast_provider_managed_plan_key(plan_key)

  def cast_customer_billing_intent(nil, _billing_interval), do: :ignore
  def cast_customer_billing_intent(_plan_key, nil), do: :ignore

  def cast_customer_billing_intent(plan_key, billing_interval) do
    with {:ok, normalized_plan_key} <- cast_customer_selectable_plan_key(plan_key),
         {:ok, normalized_billing_interval} <- cast_billing_interval(billing_interval) do
      {:ok, normalized_plan_key, normalized_billing_interval}
    end
  end

  def cast_billing_interval(interval) when interval in @valid_billing_intervals, do: {:ok, interval}

  def cast_billing_interval(interval) when is_binary(interval) do
    case String.downcase(interval) do
      "monthly" -> {:ok, :monthly}
      "yearly" -> {:ok, :yearly}
      _ -> {:error, :invalid_billing_interval}
    end
  end

  def cast_billing_interval(_), do: {:error, :invalid_billing_interval}
end
