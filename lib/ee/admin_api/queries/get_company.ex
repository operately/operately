defmodule OperatelyEE.AdminApi.Queries.GetCompany do
  use TurboConnect.Query

  alias Operately.Companies.Company

  inputs do
    field :id, :company_id
  end

  outputs do
    field :company, :company
  end

  def call(_conn, inputs) do
    with {:ok, company} <- load(inputs.id) do
      {:ok, serialize(company)}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _e -> {:error, :internal_server_error}
    end
  end

  defp load(id) do
    Company.get(:system, short_id: id, opts: [
      after_load: [
        &Company.load_owners/1,
        &Company.load_people_count/1,
        &Company.load_goals_count/1,
        &Company.load_spaces_count/1,
        &Company.load_projects_count/1,
        &Company.load_last_activity_event/1
      ]
    ])
  end

  defp serialize(company) do
    %{company: 
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
    }
  end

end
