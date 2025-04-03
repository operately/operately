defmodule Operately.Operations.ProjectKeyResourceDeleting do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}

  def run(author, key_resource) do
    Multi.new()
    |> Multi.delete(:key_resource, key_resource)
    |> Activities.insert_sync(author.id, :project_key_resource_deleted, fn _changes ->
      %{
        company_id: key_resource.project.company_id,
        space_id: key_resource.project.group_id,
        project_id: key_resource.project_id,
        title: key_resource.title,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:key_resource)
  end
end
