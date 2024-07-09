defmodule OperatelyWeb.Api.Mutations.EditProjectPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :access_levels, :access_levels
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.project_id)

    project = Operately.Projects.get_project!(id)

    # todo

    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
