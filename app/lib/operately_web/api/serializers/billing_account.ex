defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.CompanyBillingAccount do
  def serialize(account, level: :essential) do
    %{
      access_state: account.access_state || :normal,
      access_state_reason: account.access_state_reason,
      access_state_started_at: account.access_state_started_at,
      access_state_ends_at: account.access_state_ends_at
    }
  end

  def serialize(account, level: :full) do
    %{
      provider: account.provider,
      plan_key: account.plan_key,
      billing_interval: account.billing_interval,
      status: account.status,
      suggested_plan_key: account.suggested_plan_key,
      suggested_billing_interval: account.suggested_billing_interval,
      suggested_plan_source: account.suggested_plan_source,
      current_period_end: account.current_period_end,
      cancel_at_period_end: account.cancel_at_period_end,
      pending_plan_key: account.pending_plan_key,
      pending_billing_interval: account.pending_billing_interval,
      pending_checkout_started_at: account.pending_checkout_started_at,
      scheduled_plan_key: account.scheduled_plan_key,
      scheduled_billing_interval: account.scheduled_billing_interval,
      scheduled_change_effective_at: account.scheduled_change_effective_at,
      last_synced_at: account.last_synced_at,
      access_state: account.access_state || :normal,
      access_state_reason: account.access_state_reason,
      access_state_started_at: account.access_state_started_at,
      access_state_ends_at: account.access_state_ends_at
    }
  end
end
