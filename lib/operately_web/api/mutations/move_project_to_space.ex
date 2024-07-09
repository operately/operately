defmodule OperatelyWeb.Api.Mutations.MoveProjectToSpace do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :space_id, :string
  end

  def call(conn, inputs) do
    author = me(conn)

    {:ok, project_id} = decode_id(inputs.project_id)
    {:ok, space_id} = decode_id(inputs.space_id)

    project = Operately.Projects.get_project!(project_id)
    {:ok, _project} = Operately.Projects.move_project_to_space(author, project, space_id)

    {:ok, %{}}
  end
end
