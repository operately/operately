defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.PlanDefinition do
  def serialize(plan, level: :essential) do
    %{
      key: plan.plan_key,
      display_name: plan.display_name,
      tier_rank: plan.tier_rank,
      customer_selectable: plan.customer_selectable,
      member_limit: plan.member_limit,
      storage_limit_bytes: plan.storage_limit_bytes
    }
  end

  def serialize(plan, level: :full) do
    serialize(plan, level: :essential)
    |> Map.merge(%{
      id: OperatelyWeb.Paths.billing_plan_definition_id(plan),
      tier_rank: plan.tier_rank,
      billing_behavior: plan.billing_behavior,
      customer_selectable: plan.customer_selectable,
      archived_at: plan.archived_at
    })
  end
end
