defmodule OperatelyEE.AdminApi.Queries.GetCompanies do
  use TurboConnect.Query

  inputs do
  end

  outputs do
    field :companies, list_of(:company)
  end

  def call(_conn, _inputs) do
    companies = Operately.Companies.list_companies()

    {:ok, serialize(companies)}
  end

  defp serialize(companies) do
    %{companies: Enum.map(companies, &serialize_company/1)}
  end

  defp serialize_company(company) do
    %{
      id: company.short_id,
      name: company.name,
    }
  end
end
