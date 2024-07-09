defmodule OperatelyWeb.Api.Mutations.CloseProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :retrospective, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.project_id)
    project = Operately.Projects.get_project!(id)
    {:ok, project} = Operately.Operations.ProjectClosed.run(me(conn), project, inputs.retrospective)

    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
