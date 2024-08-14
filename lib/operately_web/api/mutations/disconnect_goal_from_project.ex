defmodule OperatelyWeb.Api.Mutations.DisconnectGoalFromProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :project_id, :string
    field :goal_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, project_id} = decode_id(inputs.project_id)

    case load_project(person, project_id) do
      nil ->
        query(project_id)
        |> forbidden_or_not_found(person.id)

      project ->
        {:ok, project} = Operately.Operations.ProjectGoalDisconnection.run(person, project)
        {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
    end
  end

  defp load_project(person, project_id) do
    query(project_id)
    |> filter_by_edit_access(person.id)
    |> Repo.one()
  end

  defp query(project_id) do
    from(p in Operately.Projects.Project, where: p.id == ^project_id)
  end
end
