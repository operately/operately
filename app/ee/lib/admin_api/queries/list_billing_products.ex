defmodule OperatelyEE.AdminApi.Queries.ListBillingProducts do
  use TurboConnect.Query

  alias Operately.Billing

  inputs do
  end

  outputs do
    field :products, list_of(:billing_product)
  end

  def call(_conn, _inputs) do
    products = Billing.list_products()
    {:ok, %{products: OperatelyWeb.Api.Serializer.serialize(products, level: :essential)}}
  end
end
