defmodule OperatelyWeb.Api.Mutations.ArchiveProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, project_id} = decode_id(inputs.project_id)

    project = Operately.Projects.get_project!(project_id)
    {:ok, project} = Operately.Projects.archive_project(person, project)

    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
