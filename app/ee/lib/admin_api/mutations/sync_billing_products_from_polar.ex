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
      case Operately.Billing.Polar.ProductSync.run() do
        {:ok, count} ->
          {:ok, %{success: true, synced_count: count}}

        {:error, :internal_server_error} ->
          {:error, :internal_server_error, "Failed to synchronize products from Polar"}

        {:error, :bad_request} ->
          {:error, :bad_request, "Failed to synchronize products from Polar"}
      end
    end
  end
end
