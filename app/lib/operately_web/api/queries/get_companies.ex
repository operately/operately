defmodule OperatelyWeb.Api.Queries.GetCompanies do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias Operately.Companies.Company

  inputs do
    field :include_member_count, :boolean
  end

  outputs do
    field :companies, list_of(:company)
  end

  def call(conn, inputs) do
    account = conn.assigns.current_account
    companies = Operately.Companies.list_companies(account)
    companies = load_member_count(companies, inputs[:include_member_count])

    {:ok, %{companies: Serializer.serialize(companies, level: :full)}}
  end

  defp load_member_count(companies, true), do: Company.load_member_count(companies)
  defp load_member_count(companies, _), do: companies

end
