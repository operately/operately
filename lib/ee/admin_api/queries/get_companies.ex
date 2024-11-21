defmodule OperatelyEE.AdminApi.Queries.GetCompanies do
  use TurboConnect.Query

  import Ecto.Query
  alias Operately.Companies.Company

  inputs do
  end

  outputs do
    field :companies, list_of(:company)
  end

  def call(_conn, _inputs) do
    companies = Operately.Companies.list_companies()
    companies = Operately.Companies.Company.load_owners(companies)
    companies = load_counts(companies)

    {:ok, serialize(companies)}
  end

  defp serialize(companies) do
    %{companies: Enum.map(companies, fn c -> serialize_company(c) end)}
  end

  defp serialize_company(company) do
    %{
      id: company.short_id,
      name: company.name,
      owners: OperatelyWeb.Api.Serializer.serialize(company.owners, level: :full),
      people_count: company.people_count,
      goals_count: company.goals_count,
      spaces_count: company.spaces_count,
      projects_count: company.projects_count
    }
  end

  def load_counts(companies) do
    ids = Enum.map(companies, fn c -> c.id end)

    query = from(
      c in Company, 
      left_join: people in assoc(c, :people), 
      left_join: spaces in assoc(c, :spaces),
      left_join: groups in assoc(c, :goals),
      left_join: projects in assoc(c, :projects),
      where: c.id in ^ids,
      group_by: c.id,
      select: %{
        id: c.id,
        people_count: count(people.id),
        goals_count: count(spaces.id),
        spaces_count: count(groups.id),
        projects_count: count(projects.id),
      }
    )

    counts = Operately.Repo.all(query)

    Enum.map(companies, fn company ->
      count = Enum.find(counts, fn c -> c.id == company.id end)

      company
      |> Map.put(:people_count, count.people_count)
      |> Map.put(:goals_count, count.goals_count)
      |> Map.put(:spaces_count, count.spaces_count)
      |> Map.put(:projects_count, count.projects_count)
    end)
  end

end
