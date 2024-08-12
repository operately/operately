defmodule OperatelyWeb.Api.Mutations.CloseProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_full_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :project_id, :string
    field :retrospective, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, id} = decode_id(inputs.project_id)

    case load_project(person, id) do
      nil ->
        query(id)
        |> forbidden_or_not_found(person.id)

      project ->
        {:ok, project} = Operately.Operations.ProjectClosed.run(me(conn), project, inputs.retrospective)
        {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
    end
  end

  defp load_project(person, project_id) do
    query(project_id)
    |> filter_by_full_access(person.id)
    |> Repo.one()
  end

  defp query(project_id) do
    from(p in Operately.Projects.Project, where: p.id == ^project_id)
  end
end
