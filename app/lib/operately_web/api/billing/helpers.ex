defmodule OperatelyWeb.Api.Billing.Helpers do
  use OperatelyWeb.Api.Helpers

  alias Operately.Billing
  alias Operately.Companies.Company

  def authorize_owner_billing_access(conn) do
    with {:ok, company} <- find_company(conn),
         {:ok, person} <- find_me(conn),
         :ok <- ensure_billing_enabled(company),
         :ok <- ensure_owner(company, person) do
      {:ok, %{company: company, person: person}}
    end
  end

  defp ensure_billing_enabled(company) do
    if Billing.billing_enabled_for_company?(company) do
      :ok
    else
      {:error, :not_found}
    end
  end

  defp ensure_owner(company, person) do
    if Company.is_owner?(company, person) do
      :ok
    else
      {:error, :forbidden}
    end
  end
end
