defmodule OperatelyWeb.Api.Billing.Refresh do
  use TurboConnect.Mutation

  alias Operately.Billing
  alias OperatelyWeb.Api.Billing.Helpers
  alias OperatelyWeb.Api.Serializer

  inputs do
  end

  outputs do
    field :billing, :billing_overview, null: false
  end

  def call(conn, _inputs) do
    with {:ok, %{company: company}} <- Helpers.authorize_owner_billing_access(conn),
         {:ok, account} <- Billing.refresh_company_billing_state(company) do
      overview = Operately.Billing.Overview.build(company, account, Billing.list_active_products())

      {:ok, %{billing: Serializer.serialize(overview, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :internal_server_error} -> {:error, :internal_server_error}
    end
  end
end
