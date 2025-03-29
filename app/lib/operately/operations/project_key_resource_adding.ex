defmodule Operately.Operations.ProjectKeyResourceAdding do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Projects.KeyResource

  def run(author, project, attrs) do
    Multi.new()
    |> Multi.insert(:key_resource, KeyResource.changeset(attrs))
    |> Activities.insert_sync(author.id, :project_key_resource_added, fn _changes ->
      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: attrs.project_id,
        title: attrs.title,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:key_resource)
  end
end
