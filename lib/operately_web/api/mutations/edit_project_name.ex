defmodule OperatelyWeb.Api.Mutations.EditProjectName do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :project_id, :string
    field :name, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, id} = decode_id(inputs.project_id)

    case Projects.get_project_and_access_level(id, person.id) do
      {:ok, project, access_level} ->
        if Permissions.can_edit_name(access_level) do
          execute(person, project, inputs)
        else
          {:error, :forbidden}
        end
      {:error, reason} -> {:error, reason}
    end
  end

  defp execute(person, project, inputs) do
    {:ok, project} = Projects.rename_project(person, project, inputs.name)
    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end
end
