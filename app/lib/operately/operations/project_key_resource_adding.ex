defmodule Operately.Operations.ProjectKeyResourceAdding do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Projects.KeyResource

  def run(author, project, attrs) do
    Multi.new()
    |> Multi.insert(:key_resource, KeyResource.changeset(attrs))
    |> Activities.insert_sync(author.id, :project_key_resource_added, fn changes ->
      key_resource = Map.fetch!(changes, :key_resource)

      %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: attrs.project_id,
        key_resource_id: key_resource.id,
        title: attrs.title,
        link: attrs.link,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:key_resource)
  end
end
