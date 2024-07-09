defmodule OperatelyWeb.Api.Mutations.RemoveKeyResource do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
  end

  outputs do
    field :key_resource, :project_key_resource
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.id)

    resource = Operately.Projects.get_key_resource!(id)
    Operately.Projects.delete_key_resource(resource)

    {:ok, %{key_resource: OperatelyWeb.Api.Serializer.serialize(resource)}}
  end
end
