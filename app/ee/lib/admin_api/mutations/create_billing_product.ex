defmodule OperatelyEE.AdminApi.Mutations.CreateBillingProduct do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :plan_family, :string
    field :billing_interval, :string
    field :polar_product_name, :string
    field :price_amount, :integer
    field? :price_currency, :string
  end

  outputs do
    field :product, :billing_product
  end

  def call(_conn, inputs) do
    if not Billing.billing_enabled?() do
      {:error, :bad_request, "Billing is not enabled on this instance"}
    else
      attrs = %{
        plan_family: inputs.plan_family,
        billing_interval: inputs.billing_interval,
        polar_product_name: inputs.polar_product_name,
        price_amount: inputs.price_amount,
        price_currency: inputs.price_currency || "usd"
      }

      case Billing.create_managed_product(attrs) do
        {:ok, product} ->
          {:ok, %{product: OperatelyWeb.Api.Serializer.serialize(product, level: :essential)}}

        {:error, :bad_request} ->
          {:error, :bad_request, "Invalid product parameters"}

        {:error, :internal_server_error} ->
          {:error, :internal_server_error, "Failed to create product in Polar"}

        {:error, _changeset} ->
          {:error, :bad_request, "Invalid product parameters"}
      end
    end
  end
end
