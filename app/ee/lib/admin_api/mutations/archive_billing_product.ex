defmodule OperatelyEE.AdminApi.Mutations.ArchiveBillingProduct do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :id, :string
  end

  outputs do
    field :product, :billing_product
  end

  def call(_conn, inputs) do
    with {:ok, id} <- decode_id(inputs.id),
         {:ok, product} <- find_product(id),
         {:ok, updated} <- Billing.update_product(product, %{archived_at: DateTime.utc_now()}) do
      {:ok, %{product: OperatelyWeb.Api.Serializer.serialize(updated, level: :essential)}}
    end
  end

  defp find_product(id) do
    case Billing.get_product(id) do
      {:ok, product} -> {:ok, product}
      {:error, :not_found} -> {:error, :not_found, "Product not found"}
    end
  end

  defp decode_id(id) do
    case Operately.ShortUuid.decode(id) do
      {:ok, decoded} -> {:ok, decoded}
      _ -> {:error, :bad_request, "Invalid product ID"}
    end
  end
end
