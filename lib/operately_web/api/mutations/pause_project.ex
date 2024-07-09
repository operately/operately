defmodule OperatelyWeb.Api.Mutations.PauseProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.project_id)
    {:ok, project} = Operately.Operations.ProjectPausing.run(me(conn), id)

    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
