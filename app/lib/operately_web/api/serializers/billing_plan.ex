defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.Plans do
  def serialize(plan, level: :essential) do
    %{
      key: plan.key,
      display_name: plan.display_name,
      member_limit: plan.member_limit,
      storage_limit_bytes: plan.storage_limit_bytes
    }
  end
end
