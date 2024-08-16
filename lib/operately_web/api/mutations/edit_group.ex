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

    with {:ok, space_id} <- decode_id(inputs.id),
        {:ok, space, access_level} <- Groups.get_group_and_access_level(space_id, person.id),
        true <- Permissions.can_edit(access_level)
    do
      execute(person, space, inputs)
    else
      nil -> {:error, :not_found}
      false -> {:error, :forbidden}
      _ -> {:error, :bad_request}
    end
  end

  defp execute(person, space, inputs) do
    {:ok, space} = Groups.edit_group_name_and_purpose(person, space, inputs)
    {:ok, %{space: Serializer.serialize(space)}}
  end
end
