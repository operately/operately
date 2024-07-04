defmodule OperatelyWeb.Api.Mutations.CreateGroup do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :name, :string
    field :mission, :string
    field :icon, :string
    field :color, :string

    field :company_permissions, :integer
    field :public_permissions, :integer
  end

  outputs do
    field :space, :space
  end

  def call(conn, inputs) do
    {:ok, group} = Operately.Groups.create_group(me(conn), inputs)
    {:ok, %{group: Serializer.serialize(group, level: :essential)}}
  end
end
