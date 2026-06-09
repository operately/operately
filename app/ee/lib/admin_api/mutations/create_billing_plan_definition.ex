defmodule OperatelyEE.AdminApi.Mutations.CreateBillingPlanDefinition do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :plan_key, :string
    field :display_name, :string
    field :sort_order, :integer
    field :tier_rank, :integer
    field :billing_behavior, :billing_behavior
    field :customer_selectable, :boolean
    field? :member_limit, :integer, null: true
    field? :storage_limit_bytes, :integer, null: true
  end

  outputs do
    field :plan_definition, :billing_plan_definition
  end

  def call(_conn, inputs) do
    if not Billing.billing_enabled?() do
      {:error, :bad_request, "Billing is not enabled on this instance"}
    else
      case Billing.create_plan_definition(build_attrs(inputs)) do
        {:ok, plan_definition} ->
          {:ok, %{plan_definition: OperatelyWeb.Api.Serializer.serialize(plan_definition, level: :full)}}

        {:error, _changeset} ->
          {:error, :bad_request, "Invalid plan definition parameters"}
      end
    end
  end

  defp build_attrs(inputs) do
    Map.take(inputs, [
      :plan_key,
      :display_name,
      :sort_order,
      :tier_rank,
      :billing_behavior,
      :customer_selectable,
      :member_limit,
      :storage_limit_bytes
    ])
  end
end
