defmodule Operately.Billing.AccessStateReconciling do
  @moduledoc """
  Derives the persisted company billing access state from synced provider attrs,
  the existing local billing projection, and current company usage.
  """

  alias Operately.Billing.CompanyBillingAccount
  alias Operately.Billing.Plans
  alias Operately.Billing.Usage

  @grace_period_seconds 14 * 24 * 60 * 60

  def run(%Operately.Companies.Company{} = company, account, attrs, opts \\ []) do
    now = Keyword.get(opts, :now, DateTime.utc_now())

    attrs
    |> Map.merge(reconciled_fields(company, account, attrs, now))
  end

  defp reconciled_fields(company, account, attrs, now) do
    company
    |> target_reason(account, attrs)
    |> transition(account, now)
  end

  defp target_reason(company, account, attrs) do
    # Remediation grace starts only after a downgrade/cancellation actually
    # becomes current, but once active it should survive later syncs until the
    # company either fits the current plan again or becomes read-only.
    cond do
      # Payment-default takes precedence over downgrade remediation because it is
      # the more urgent company-wide recovery state.
      past_due?(Map.get(attrs, :status)) ->
        :past_due

      over_limit?(company, attrs) && (downgrade_became_current?(account, attrs) || existing_over_limit_state?(account)) ->
        :over_limit_after_downgrade

      true ->
        nil
    end
  end

  defp transition(nil, _account, _now), do: normal_state_fields()

  defp transition(reason, account, now) do
    cond do
      read_only_for_reason?(account, reason) ->
        read_only_state_fields(reason, account.access_state_started_at || now)

      grace_state_for_reason?(account, reason) && grace_expired?(account, now) ->
        promote_grace_to_read_only(account, reason)

      grace_state_for_reason?(account, reason) ->
        grace_state_fields(
          grace_state(reason),
          reason,
          account.access_state_started_at || now,
          account.access_state_ends_at || grace_ends_at(now)
        )

      # If the company is already read-only for another reason and payment
      # default now applies, keep the company read-only while switching to the
      # more urgent reason.
      reason == :past_due && read_only?(account) ->
        read_only_state_fields(reason, account.access_state_started_at || now)

      true ->
        grace_state_fields(grace_state(reason), reason, now, grace_ends_at(now))
    end
  end

  defp over_limit?(company, attrs) do
    plan_key = Plans.resolve_current_plan_key(Map.get(attrs, :plan_key))
    member_limit = Plans.member_limit(plan_key)
    storage_limit_bytes = Plans.storage_limit_bytes(plan_key)

    limit_exceeded?(Usage.active_member_count(company), member_limit) ||
      limit_exceeded?(Usage.company_storage_bytes(company), storage_limit_bytes)
  end

  defp downgrade_became_current?(nil, _attrs), do: false

  defp downgrade_became_current?(%CompanyBillingAccount{} = account, attrs) do
    previous_plan_key = Plans.resolve_current_plan_key(account.plan_key)
    new_plan_key = Plans.resolve_current_plan_key(Map.get(attrs, :plan_key))

    # We only start remediation when the newly effective plan has lower
    # entitlements than the previously effective plan.
    lower_entitlements?(previous_plan_key, new_plan_key) &&
      (scheduled_target_became_current?(account, attrs) || cancel_to_free_became_current?(account, attrs))
  end

  defp scheduled_target_became_current?(%CompanyBillingAccount{} = account, attrs) do
    # Sync attrs may arrive as strings or atoms depending on the call path, so
    # normalize both sides before comparing the scheduled target to the new
    # current plan and interval.
    not is_nil(account.scheduled_plan_key) &&
      normalize_plan_key(account.scheduled_plan_key) == normalize_plan_key(Map.get(attrs, :plan_key)) &&
      normalize_billing_interval(account.scheduled_billing_interval) == normalize_billing_interval(Map.get(attrs, :billing_interval))
  end

  defp cancel_to_free_became_current?(%CompanyBillingAccount{} = account, attrs) do
    account.cancel_at_period_end &&
      Plans.resolve_current_plan_key(account.plan_key) != "free" &&
      Plans.resolve_current_plan_key(Map.get(attrs, :plan_key)) == "free"
  end

  defp lower_entitlements?(previous_plan_key, new_plan_key) do
    previous_member_limit = Plans.member_limit(previous_plan_key)
    previous_storage_limit = Plans.storage_limit_bytes(previous_plan_key)
    new_member_limit = Plans.member_limit(new_plan_key)
    new_storage_limit = Plans.storage_limit_bytes(new_plan_key)

    lower_limit?(previous_member_limit, new_member_limit) ||
      lower_limit?(previous_storage_limit, new_storage_limit)
  end

  defp existing_over_limit_state?(account), do: state_for_reason?(account, :over_limit_after_downgrade)

  defp state_for_reason?(%CompanyBillingAccount{access_state_reason: reason, access_state: state}, reason)
       when state in [:over_limit_grace, :payment_grace, :read_only],
       do: true

  defp state_for_reason?(_, _reason), do: false

  defp grace_state_for_reason?(%CompanyBillingAccount{access_state: state, access_state_reason: reason}, reason)
       when state in [:payment_grace, :over_limit_grace],
       do: true

  defp grace_state_for_reason?(_, _reason), do: false

  defp read_only_for_reason?(%CompanyBillingAccount{access_state: :read_only, access_state_reason: reason}, reason), do: true
  defp read_only_for_reason?(_, _reason), do: false

  defp read_only?(%CompanyBillingAccount{access_state: :read_only}), do: true
  defp read_only?(_), do: false

  defp grace_expired?(%CompanyBillingAccount{access_state_ends_at: nil}, _now), do: false
  defp grace_expired?(%CompanyBillingAccount{access_state_ends_at: ends_at}, now), do: DateTime.compare(ends_at, now) != :gt

  defp promote_grace_to_read_only(%CompanyBillingAccount{} = account, reason) do
    # Read-only starts at the grace deadline, not at the time this sync happened.
    read_only_state_fields(reason, account.access_state_ends_at || account.access_state_started_at || DateTime.utc_now())
  end

  defp grace_state(:past_due), do: :payment_grace
  defp grace_state(:over_limit_after_downgrade), do: :over_limit_grace

  defp grace_state_fields(state, reason, started_at, ends_at) do
    %{
      access_state: state,
      access_state_reason: reason,
      access_state_started_at: started_at,
      access_state_ends_at: ends_at
    }
  end

  defp read_only_state_fields(reason, started_at) do
    %{
      access_state: :read_only,
      access_state_reason: reason,
      access_state_started_at: started_at,
      access_state_ends_at: nil
    }
  end

  defp normal_state_fields do
    %{
      access_state: :normal,
      access_state_reason: nil,
      access_state_started_at: nil,
      access_state_ends_at: nil
    }
  end

  defp grace_ends_at(now), do: DateTime.add(now, @grace_period_seconds, :second)

  defp normalize_plan_key(plan_key) do
    Plans.normalize_key(plan_key) || plan_key
  end

  defp lower_limit?(nil, nil), do: false
  defp lower_limit?(nil, _new_limit), do: true
  defp lower_limit?(_previous_limit, nil), do: false
  defp lower_limit?(previous_limit, new_limit), do: new_limit < previous_limit

  defp limit_exceeded?(_usage, nil), do: false
  defp limit_exceeded?(usage, limit), do: usage > limit

  defp normalize_billing_interval(interval) when interval in [:monthly, :yearly], do: interval

  defp normalize_billing_interval(interval) when is_binary(interval) do
    case String.downcase(interval) do
      "monthly" -> :monthly
      "yearly" -> :yearly
      _ -> interval
    end
  end

  defp normalize_billing_interval(interval), do: interval

  defp past_due?(:past_due), do: true
  defp past_due?(status) when is_binary(status), do: String.downcase(status) == "past_due"
  defp past_due?(_status), do: false
end
