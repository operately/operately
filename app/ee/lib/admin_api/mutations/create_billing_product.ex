defmodule OperatelyEE.AdminApi.Mutations.CreateBillingProduct do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
    field :provider, :string
    field :plan_family, :string
    field :billing_interval, :string
    field :polar_product_id, :string
    field :polar_product_name, :string
    field :price_amount, :integer
    field :price_currency, :string
  end

  outputs do
    field :product, :billing_product
  end

  def call(_conn, inputs) do
    attrs = %{
      provider: inputs.provider || "polar",
      plan_family: inputs.plan_family,
      billing_interval: inputs.billing_interval,
      polar_product_id: inputs.polar_product_id,
      polar_product_name: inputs.polar_product_name,
      price_amount: inputs.price_amount,
      price_currency: inputs.price_currency
    }

    case Billing.create_product(attrs) do
      {:ok, product} ->
        {:ok, %{product: OperatelyWeb.Api.Serializer.serialize(product, level: :essential)}}

      {:error, _changeset} ->
        {:error, :bad_request, "Invalid product parameters"}
    end
  end
end
