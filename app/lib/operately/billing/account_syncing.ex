defmodule Operately.Billing.AccountSyncing do
  alias Operately.Billing
  alias Operately.Billing.CompanyBillingAccount

  @doc """
  Upserts a billing account with normalized state fetched from Polar.
  Called by webhook processing and manual refresh.
  """
  def run(%Operately.Companies.Company{} = company, attrs) do
    case Billing.get_billing_account_by_company(company) do
      nil ->
        Billing.create_billing_account(Map.put(attrs, :company_id, company.id))

      account ->
        attrs =
          if pending_checkout_completed?(account, attrs) do
            attrs
            |> Map.put(:pending_plan_key, nil)
            |> Map.put(:pending_billing_interval, nil)
            |> Map.put(:pending_checkout_started_at, nil)
          else
            attrs
          end

        Billing.update_billing_account(account, attrs)
    end
  end

  defp pending_checkout_completed?(%CompanyBillingAccount{} = account, attrs) do
    pending_target_matches?(account, attrs) && synced_status_allows_pending_clear?(Map.get(attrs, :status))
  end

  defp pending_target_matches?(%CompanyBillingAccount{} = account, attrs) do
    with {:ok, pending_plan_key} <- cast_plan_family(account.pending_plan_key),
         {:ok, pending_billing_interval} <- cast_billing_interval(account.pending_billing_interval),
         {:ok, synced_plan_key} <- cast_plan_family(Map.get(attrs, :plan_key)),
         {:ok, synced_billing_interval} <- cast_billing_interval(Map.get(attrs, :billing_interval)) do
      pending_plan_key == synced_plan_key && pending_billing_interval == synced_billing_interval
    else
      _ -> false
    end
  end

  defp synced_status_allows_pending_clear?(status) when status in [:active, :past_due], do: true

  defp synced_status_allows_pending_clear?(status) when is_binary(status) do
    String.downcase(status) in ["active", "past_due"]
  end

  defp synced_status_allows_pending_clear?(_status), do: false

  defp cast_plan_family(plan_family) when plan_family in [:team, :business], do: {:ok, plan_family}

  defp cast_plan_family(plan_family) when is_binary(plan_family) do
    case String.downcase(plan_family) do
      "team" -> {:ok, :team}
      "business" -> {:ok, :business}
      _ -> {:error, :invalid_plan_family}
    end
  end

  defp cast_plan_family(_), do: {:error, :invalid_plan_family}

  defp cast_billing_interval(interval) when interval in [:monthly, :yearly], do: {:ok, interval}

  defp cast_billing_interval(interval) when is_binary(interval) do
    case String.downcase(interval) do
      "monthly" -> {:ok, :monthly}
      "yearly" -> {:ok, :yearly}
      _ -> {:error, :invalid_billing_interval}
    end
  end

  defp cast_billing_interval(_), do: {:error, :invalid_billing_interval}
end
