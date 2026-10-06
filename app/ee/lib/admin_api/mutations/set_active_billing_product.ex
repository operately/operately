defmodule OperatelyEE.AdminApi.Mutations.SetActiveBillingProduct do
  use Gettext, backend: OperatelyWeb.Gettext
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :id, :string
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
           {:ok, activated} <- Billing.set_active_product(product) do
        {:ok, %{product: OperatelyWeb.Api.Serializer.serialize(activated, level: :essential)}}
      else
        {:error, :archived} ->
          {:error, :bad_request, gettext("Archived products cannot be activated")}

        {:error, error, message} ->
          {:error, error, message}

        {:error, _changeset} ->
          {:error, :bad_request, gettext("Invalid product parameters")}
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
end
