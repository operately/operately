defmodule OperatelyWeb.Api.Mutations.EditSpacePermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions

  inputs do
    field :space_id, :string
    field :access_levels, :access_levels
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    person = me(conn)

    load_group(inputs, person)
    |> verify_permissions()
    |> execute(person, inputs)
  end

  defp load_group(inputs, person) do
    {:ok, space_id} = decode_id(inputs.space_id)

    case Groups.get_group_and_access_level(space_id, person.id) do
      nil -> {:error, :not_found}
      result -> result
    end
  end

  defp verify_permissions({:ok, space, access_level}) do
    if Permissions.can_edit_permissions(access_level) do
      {:ok, space}
    else
      {:error, :forbidden}
    end
  end
  defp verify_permissions(error), do: error

  defp execute({:ok, space}, person, inputs) do
    {:ok, _} = Operately.Operations.GroupPermissionsEditing.run(person, space, inputs.access_levels)
    {:ok, %{success: true}}
  end
  defp execute(error, _, _), do: error
end
