defmodule OperatelyWeb.Api.Mutations.UpdateProjectDescription do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :description, :string
  end

  outputs do
    field :project, :project
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.project_id)
    project = Operately.Projects.get_project!(id)

    {:ok, project} = Operately.Projects.update_project(project, %{
      description: Jason.decode!(inputs.description)
    })

    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
