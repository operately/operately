defmodule OperatelyEE.AdminApi.Mutations.UpdateBillingProduct do
  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :id, :string
    field? :polar_product_name, :string
    field? :price_amount, :integer
    field? :price_currency, :string
  end

  outputs do
    field :product, :billing_product
  end

  def call(_conn, inputs) do
    if not Billing.billing_enabled?() do
      {:error, :bad_request, gettext("Billing is not enabled on this instance")}
    else
      with {:ok, id} <- decode_id(inputs.id),
           {:ok, product} <- find_product(id),
           attrs <- build_attrs(inputs),
           {:ok, updated} <- Billing.update_managed_product(product, attrs) do
        {:ok, %{product: OperatelyWeb.Api.Serializer.serialize(updated, level: :essential)}}
      else
        {:error, :internal_server_error} ->
          {:error, :internal_server_error, gettext("Failed to update product in Polar")}

        {:error, error, message} ->
          {:error, error, message}
      end
    end
  end

  defp find_product(id) do
    case Billing.get_product(id) do
      {:ok, product} -> {:ok, product}
      {:error, :not_found} -> {:error, :not_found, gettext("Product not found")}
    end
  end

  defp decode_id(id) do
    case Operately.ShortUuid.decode(id) do
      {:ok, decoded} -> {:ok, decoded}
      _ -> {:error, :bad_request, gettext("Invalid product ID")}
    end
  end

  defp build_attrs(inputs) do
    Map.take(inputs, [:polar_product_name, :price_amount, :price_currency])
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end
end
