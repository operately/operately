defmodule OperatelyWeb.Api.Queries.SearchProjectContributorCandidates do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects

  inputs do
    field :project_id, :string
    field :query, :string
  end

  outputs do
    field :people, list_of(:person)
  end

  def call(_conn, inputs) do
    {:ok, project_id} = decode_id(inputs.project_id)
    people = Projects.list_project_contributor_candidates(project_id, inputs.query, [], 10)

    {:ok, %{people: Serializer.serialize(people)}}
  end
end
