defmodule OperatelyEE.AdminApi.Mutations.UpdateBillingPlanDefinition do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :id, :string
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
    with {:ok, id} <- decode_id(inputs.id),
         {:ok, plan_definition} <- find_plan_definition(id),
         attrs <- build_attrs(inputs),
         {:ok, updated} <- Billing.update_plan_definition(plan_definition, attrs) do
      {:ok, %{plan_definition: OperatelyWeb.Api.Serializer.serialize(updated, level: :full)}}
    else
      {:error, error, message} ->
        {:error, error, message}

      {:error, _changeset} ->
        {:error, :bad_request, "Invalid plan definition parameters"}
    end
  end

  defp find_plan_definition(id) do
    case Billing.get_plan_definition(id) do
      {:ok, plan_definition} -> {:ok, plan_definition}
      {:error, :not_found} -> {:error, :not_found, "Plan definition not found"}
    end
  end

  defp decode_id(id) do
    case Operately.ShortUuid.decode(id) do
      {:ok, decoded} -> {:ok, decoded}
      _ -> {:error, :bad_request, "Invalid plan definition ID"}
    end
  end

  defp build_attrs(inputs) do
    Map.take(inputs, [
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
