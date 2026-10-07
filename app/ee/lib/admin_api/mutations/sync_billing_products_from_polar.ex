defmodule OperatelyEE.AdminApi.Mutations.SyncBillingProductsFromPolar do
  use Gettext, backend: OperatelyWeb.Gettext
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
      {:error, :bad_request, gettext("Billing is not enabled on this instance")}
    else
      case Operately.Billing.Polar.Operations.ProductSync.run() do
        {:ok, count} ->
          {:ok, %{success: true, synced_count: count}}

        {:error, :internal_server_error} ->
          {:error, :internal_server_error, gettext("Failed to synchronize products from Polar")}

        {:error, :bad_request} ->
          {:error, :bad_request, gettext("Failed to synchronize products from Polar")}
      end
    end
  end
end
