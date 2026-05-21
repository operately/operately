defmodule OperatelyEE.AdminApi.Mutations.UpdateBillingProduct do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :id, :string
    field? :plan_family, :string
    field? :billing_interval, :string
    field? :polar_product_id, :string
    field? :polar_product_name, :string
    field? :price_amount, :integer
    field? :price_currency, :string
  end

  outputs do
    field :product, :billing_product
  end

  def call(_conn, inputs) do
    with {:ok, id} <- decode_id(inputs.id),
         {:ok, product} <- find_product(id),
         attrs <- build_attrs(inputs),
         {:ok, updated} <- Billing.update_product(product, attrs) do
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

  defp build_attrs(inputs) do
    Map.take(inputs, [:plan_family, :billing_interval, :polar_product_id, :polar_product_name, :price_amount, :price_currency])
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end
end
