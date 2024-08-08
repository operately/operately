defmodule OperatelyWeb.Api.Mutations.ArchiveProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :project_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    {:ok, project_id} = decode_id(inputs.project_id)

    case load_project(me(conn), project_id) do
      {:error, reason} ->
        {:error, reason}

      project ->
        {:ok, project} = Operately.Projects.archive_project(me(conn), project)
        {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
    end
  end

  defp load_project(person, project_id) do
    query = from(p in Operately.Projects.Project, where: p.id == ^project_id)

    filter_by_full_access(query, person.id)
    |> Repo.one()
    |> case do
      nil -> forbidden_or_not_found(query, person.id)
      project -> project
    end
  end
end
