defmodule OperatelyEE.AdminApi.Mutations.ArchiveBillingPlanDefinition do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :id, :string
  end

  outputs do
    field :plan_definition, :billing_plan_definition
  end

  def call(_conn, inputs) do
    if not Billing.billing_enabled?() do
      {:error, :bad_request, "Billing is not enabled on this instance"}
    else
      with {:ok, id} <- decode_id(inputs.id),
           {:ok, plan_definition} <- find_plan_definition(id),
           {:ok, archived} <- Billing.archive_plan_definition(plan_definition) do
        {:ok, %{plan_definition: OperatelyWeb.Api.Serializer.serialize(archived, level: :full)}}
      else
        {:error, :cannot_archive_free_plan} ->
          {:error, :bad_request, "The free plan cannot be archived"}

        {:error, error, message} ->
          {:error, error, message}

        {:error, _changeset} ->
          {:error, :bad_request, "Invalid plan definition parameters"}
      end
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
end
