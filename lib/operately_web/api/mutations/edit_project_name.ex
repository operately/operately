defmodule OperatelyWeb.Api.Mutations.EditProjectName do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :name, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.project_id)
    project = Operately.Projects.get_project!(id)
    {:ok, project} = Operately.Projects.rename_project(me(conn), project, inputs.name)

    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
