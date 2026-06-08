defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.PlanDefinition do
  def serialize(plan, level: :essential) do
    %{
      key: plan.plan_key,
      display_name: plan.display_name,
      member_limit: plan.member_limit,
      storage_limit_bytes: plan.storage_limit_bytes
    }
  end

  def serialize(plan, level: :full) do
    serialize(plan, level: :essential)
    |> Map.merge(%{
      id: OperatelyWeb.Paths.billing_plan_definition_id(plan),
      sort_order: plan.sort_order
    })
  end
end
