defmodule OperatelyWeb.Api.Queries.GetCompanies do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :include_member_count, :boolean
  end

  outputs do
    field :companies, list_of(:company)
  end

  def call(conn, _inputs) do
    account = conn.assigns.current_account
    companies = Operately.Companies.list_companies(account)

    {:ok, %{
      companies: Serializer.serialize(companies, level: :essential)
    }}
  end

end
