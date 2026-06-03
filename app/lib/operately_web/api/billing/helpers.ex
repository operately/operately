defmodule OperatelyWeb.Api.Billing.Helpers do
  use OperatelyWeb.Api.Helpers

  alias Operately.Billing
  alias Operately.Access.Binding
  alias Operately.Companies.Company
  alias Operately.Companies.Permissions

  def authorize_billing_management_access(conn) do
    with {:ok, company} <- find_company(conn),
         {:ok, person} <- find_me(conn),
         :ok <- ensure_billing_enabled(company),
         {:ok, company} <- Company.get(person, id: company.id),
         {:ok, :allowed} <- Permissions.check(company.request_info.access_level, :can_manage_billing, company_read_only: false) do
      {:ok, %{company: company, person: person}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
    end
  end

  def authorize_admin_billing_read_access(conn) do
    with {:ok, company} <- find_company(conn),
         {:ok, person} <- find_me(conn),
         :ok <- ensure_billing_enabled(company),
         {:ok, company} <- Company.get(person, id: company.id),
         {:ok, :allowed} <- Permissions.check(company.request_info.access_level, :is_admin, company_read_only: false) do
      {:ok, %{company: company, person: person}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
    end
  end

  def authorize_member_billing_read_access(conn) do
    with {:ok, company} <- find_company(conn),
         {:ok, person} <- find_me(conn),
         :ok <- ensure_billing_enabled(company),
         {:ok, company} <- Company.get(person, id: company.id, opts: [required_access_level: Binding.minimal_access()]) do
      {:ok, %{company: company, person: person}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :invalid_requester} -> {:error, :not_found}
    end
  end

  defp ensure_billing_enabled(company) do
    if Billing.billing_enabled_for_company?(company) do
      :ok
    else
      {:error, :not_found}
    end
  end
end
