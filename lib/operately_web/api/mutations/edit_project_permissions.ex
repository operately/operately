defmodule OperatelyWeb.Api.Mutations.EditProjectPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :project_id, :string
    field :access_levels, :access_levels
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, id} = decode_id(inputs.project_id)

    case Projects.get_project_and_access_level(id, person.id) do
      {:ok, project, access_level} ->
        if Permissions.can_edit_permissions(access_level) do
          execute(person, project, inputs)
        else
          {:error, :forbidden}
        end
      {:error, reason} -> {:error, reason}
    end
  end

  defp execute(person, project, inputs) do
    Operately.Operations.ProjectPermissionsEditing.run(person, project, inputs.access_levels)
    {:ok, %{success: true}}
  end
end
