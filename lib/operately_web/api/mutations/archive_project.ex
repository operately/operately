defmodule OperatelyWeb.Api.Mutations.ArchiveProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2, filter_by_view_access: 2]

  inputs do
    field :project_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    {:ok, project_id} = decode_id(inputs.project_id)

    case load_project(me(conn), project_id) do
      nil ->
        error(me(conn), project_id)
      project ->
        {:ok, project} = Operately.Projects.archive_project(me(conn), project)
        {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
    end
  end

  defp load_project(person, project_id) do
    from(p in Operately.Projects.Project, where: p.id == ^project_id)
    |> filter_by_full_access(person.id)
    |> Repo.one()
  end

  defp error(person, project_id) do
    query = from(p in Operately.Projects.Project, where: p.id == ^project_id)
      |> filter_by_view_access(person.id)

    if Repo.exists?(query) do
      {:error, :forbidden}
    else
      {:error, :not_found}
    end
  end
end
