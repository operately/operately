defmodule OperatelyWeb.Api.Mutations.EditGroup do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups
  alias Operately.Groups.Permissions

  inputs do
    field :id, :string
    field :name, :string
    field :mission, :string
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, space_id} = decode_id(inputs.id)

    case Groups.get_group_and_access_level(space_id, person.id) do
      {:ok, space, access_level} ->
        if Permissions.can_edit(access_level) do
          execute(person, space, inputs)
        else
          {:error, :forbidden}
        end
      nil -> {:error, :not_found}
    end
  end

  defp execute(person, space, inputs) do
    {:ok, space} = Groups.edit_group_name_and_purpose(person, space, inputs)
    {:ok, %{space: Serializer.serialize(space)}}
  end
end
