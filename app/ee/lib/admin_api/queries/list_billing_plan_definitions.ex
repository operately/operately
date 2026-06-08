defmodule OperatelyEE.AdminApi.Queries.ListBillingPlanDefinitions do
  use TurboConnect.Query

  alias Operately.Billing

  inputs do
  end

  outputs do
    field :plan_definitions, list_of(:billing_plan_definition)
  end

  def call(_conn, _inputs) do
    plan_definitions = Billing.list_plan_definitions()

    {:ok, %{plan_definitions: OperatelyWeb.Api.Serializer.serialize(plan_definitions, level: :full)}}
  end
end
