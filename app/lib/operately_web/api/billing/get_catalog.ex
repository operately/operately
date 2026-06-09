defmodule OperatelyWeb.Api.Billing.GetCatalog do
  use TurboConnect.Query

  alias Operately.Billing
  alias OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Serializer

  inputs do
  end

  outputs do
    field :plans, list_of(:billing_plan_definition), null: false
    field :catalog_products, list_of(:billing_catalog_product), null: false
  end

  def call(conn, _inputs) do
    with {:ok, _account} <- Helpers.find_account(conn) do
      {:ok,
       %{
         plans: serialized_plans(),
         catalog_products: serialized_products()
       }}
    else
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp serialized_plans do
    if Billing.billing_enabled?() do
      Billing.list_customer_selectable_plan_definitions()
      |> Serializer.serialize(level: :essential)
    else
      []
    end
  end

  defp serialized_products do
    if Billing.billing_enabled?() do
      Billing.list_active_products()
      |> Serializer.serialize(level: :essential)
    else
      []
    end
  end
end
