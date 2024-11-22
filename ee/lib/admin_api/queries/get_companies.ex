defmodule OperatelyEE.AdminApi.Queries.GetCompanies do
  use TurboConnect.Query

  alias Operately.Companies
  alias Operately.Companies.Company

  inputs do
  end

  outputs do
    field :companies, list_of(:company)
  end

  def call(_conn, _inputs) do
    companies = load_companies()

    {:ok, serialize(companies)}
  end

  defp load_companies() do
    Companies.list_companies()
    |> Company.load_owners()
    |> Company.load_people_count()
    |> Company.load_goals_count()
    |> Company.load_spaces_count()
    |> Company.load_projects_count()
    |> Company.load_last_activity_event()
  end

  defp serialize(companies) do
    %{companies: Enum.map(companies, fn c -> serialize_company(c) end)}
  end

  defp serialize_company(company) do
    %{
      id: OperatelyWeb.Paths.company_id(company),
      name: company.name,
      people_count: company.people_count,
      goals_count: company.goals_count,
      spaces_count: company.spaces_count,
      projects_count: company.projects_count,
      owners: OperatelyWeb.Api.Serializer.serialize(company.owners, level: :full),
      last_activity_at: OperatelyWeb.Api.Serializer.serialize(company.last_activity_at, level: :essential)
    }
  end

end
