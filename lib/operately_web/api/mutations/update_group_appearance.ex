defmodule OperatelyWeb.Api.Mutations.UpdateGroupAppearance do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
    field :icon, :string
    field :color, :string
  end

  outputs do
    field :space, :space
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.id)
    group = Operately.Groups.get_group!(id)

    {:ok, _} = Operately.Groups.update_group(group, %{
      icon: inputs.icon,
      color: inputs.color
    })

    {:ok, %{space: Serializer.serialize(group)}}
  end
end
