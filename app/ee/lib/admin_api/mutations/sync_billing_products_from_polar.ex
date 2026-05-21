defmodule OperatelyEE.AdminApi.Mutations.SyncBillingProductsFromPolar do
  use TurboConnect.Mutation

  alias Operately.Billing

  inputs do
  end

  outputs do
    field :success, :boolean
    field :synced_count, :integer
  end

  def call(_conn, _inputs) do
    if not Billing.billing_enabled?() do
      {:error, :bad_request, "Billing is not enabled on this instance"}
    else
      {:ok, count} = Operately.Billing.Polar.ProductSync.run()
      {:ok, %{success: true, synced_count: count}}
    end
  end
end
