defmodule OperatelyWeb.Api.Billing.GetLimitWarnings do
  use TurboConnect.Query

  alias Operately.Billing
  alias Operately.Billing.EnforceLimits
  alias OperatelyWeb.Api.Billing.Helpers

  inputs do
  end

  outputs do
    field :warnings, :billing_limit_warnings, null: false
  end

  def call(conn, _inputs) do
    with {:ok, %{company: company}} <- Helpers.authorize_billing_management_access(conn),
         :ok <- Helpers.ensure_limit_enforcement_enabled(company) do
      catalog_products = Billing.list_active_products()

      member_limit =
        EnforceLimits.status(company, :member_count,
          requested_delta: 0,
          catalog_products: catalog_products
        )

      storage_limit =
        EnforceLimits.status(company, :storage_bytes,
          current_usage: Billing.company_storage_bytes(company),
          requested_delta: 0,
          catalog_products: catalog_products
        )

      {:ok,
       %{
         warnings: %{
           member_limit: EnforceLimits.public_details(member_limit),
           storage_limit: EnforceLimits.public_details(storage_limit)
         }
       }}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
    end
  end
end
