defmodule OperatelyEE.AdminApi.Queries.GetActiveCompanies do
  use TurboConnect.Query

  alias Operately.Companies
  alias Operately.Companies.Company

  inputs do
  end

  outputs do
    field :companies, list_of(:company)
  end

  def call(_conn, _inputs) do
    companies = load_active_companies()

    {:ok, serialize(companies)}
  end

  defp load_active_companies() do
    companies = Companies.list_companies()
    |> Company.load_people_count()
    |> Company.load_goals_count()
    |> Company.load_projects_count()
    |> Company.load_last_activity_event()

    # Filter based on our activity criteria
    active_companies = Enum.filter(companies, fn company ->
      is_active_company?(company)
    end)

    # Load additional data for the filtered companies
    active_companies
    |> Company.load_owners()
    |> Company.load_spaces_count()
  end

  defp is_active_company?(company) do
    has_multiple_members?(company) && has_multiple_goals_and_projects?(company) && has_recent_activity?(company)
  end

  # Has at least 2 members
  defp has_multiple_members?(company) do
    (company.people_count || 0) >= 2
  end

  # Has at least 2 goals and/or projects
  defp has_multiple_goals_and_projects?(company) do
    (company.goals_count || 0) + (company.projects_count || 0) >= 2
  end

  # Was active in the last 14 days
  defp has_recent_activity?(company) do
    last_activity_at = normalize_last_activity_at(company)
    days_since_activity = DateTime.diff(DateTime.utc_now(), last_activity_at, :day)
    days_since_activity <= 14
  end

  defp normalize_last_activity_at(company) do
    case company.last_activity_at do
      %DateTime{} = dt -> dt
      %NaiveDateTime{} = ndt -> DateTime.from_naive!(ndt, "Etc/UTC")
      nil -> DateTime.utc_now()
    end
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
      last_activity_at: OperatelyWeb.Api.Serializer.serialize(company.last_activity_at, level: :essential),
      inserted_at: OperatelyWeb.Api.Serializer.serialize(company.inserted_at, level: :essential)
    }
  end
end
