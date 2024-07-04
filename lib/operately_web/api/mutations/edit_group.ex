defmodule OperatelyWeb.Api.Mutations.EditGroup do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :name, :string
    field :mission, :string
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    {:ok, space_id} = decode_id(inputs.id)
    space = Operately.Groups.get_group!(space_id)

    {:ok, space} = Operately.Groups.edit_group_name_and_purpose(me(conn), space, %{
      name: inputs.name,
      mission: inputs.mission
    })

    {:ok, %{space: Serializer.serialize(space)}}
  end
end
