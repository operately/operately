defimpl OperatelyWeb.Api.Serializable, for: Operately.Billing.Overview do
  alias OperatelyWeb.Api.Serializer

  def serialize(overview, level: :essential) do
    %{
      account: Serializer.serialize(overview.account, level: :essential),
      plans: Serializer.serialize(overview.plans, level: :essential),
      catalog_products: Serializer.serialize(overview.catalog_products, level: :essential),
      member_count: overview.member_count,
      storage_usage_bytes: overview.storage_usage_bytes,
      stale: overview.stale
    }
  end
end
