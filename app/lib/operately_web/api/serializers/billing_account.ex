defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.CompanyBillingAccount do
  def serialize(account, level: :essential) do
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
      last_synced_at: account.last_synced_at
    }
  end
end
