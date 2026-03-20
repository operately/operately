defmodule OperatelyWeb.Api.Projects.SearchPotentialContributors do
  @moduledoc """
  Searches for potential contributors to add to a project.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.Projects
  alias Operately.Projects.Project

  inputs do
    field :project_id, :id, null: false
    field? :query, :string, null: true, default: ""
  end

  outputs do
    field :people, list_of(:person), null: false
  end

  def call(conn, inputs) do
    person = me(conn)

    if has_permissions?(person, inputs.project_id) do
      people = Projects.list_project_contributor_candidates(person.company_id, inputs.project_id, inputs.query, [], 10)
      {:ok, %{people: Serializer.serialize(people)}}
    else
      {:ok, %{people: []}}
    end
  end

  defp has_permissions?(person, project_id) do
    from(p in Project, where: p.id == ^project_id)
    |> filter_by_view_access(person.id)
    |> Repo.exists?()
  end
end
