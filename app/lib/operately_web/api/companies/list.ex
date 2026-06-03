defmodule OperatelyWeb.Api.Companies.List do
  @moduledoc """
  Lists all companies for the current account.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias Operately.Companies.Company

  inputs do
    field? :include_member_count, :boolean, null: true
    field? :is_company_owner, :boolean, null: false
    field? :can_manage_billing, :boolean, null: false
  end

  outputs do
    field :companies, list_of(:company), null: false
  end

  def call(conn, inputs) do
    account = conn.assigns.current_account
    companies = load_companies(account, inputs[:is_company_owner], inputs[:can_manage_billing])
    companies = load_member_count(companies, inputs[:include_member_count])

    {:ok, %{companies: Serializer.serialize(companies, level: :full)}}
  end

  defp load_companies(account, true, _), do: Operately.Companies.list_companies_by_owner(account)
  defp load_companies(account, _, true), do: Operately.Companies.list_companies_by_billing_manager(account)
  defp load_companies(account, _, _), do: Operately.Companies.list_companies(account)

  defp load_member_count(companies, true), do: Company.load_member_count(companies)
  defp load_member_count(companies, _), do: companies

end
