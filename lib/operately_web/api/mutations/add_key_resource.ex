defmodule OperatelyWeb.Api.Mutations.AddKeyResource do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :title, :string
    field :link, :string
    field :resource_type, :string
  end

  outputs do
    field :key_resource, :project_key_resource
  end

  def call(_conn, inputs) do
    {:ok, project_id} = decode_id(inputs.project_id)

    inputs = Map.put(inputs, :project_id, project_id)
    {:ok, resource} = Operately.Projects.create_key_resource(inputs)
    resource = Operately.Repo.preload(resource, :project)

    {:ok, %{key_resource: OperatelyWeb.Api.Serializer.serialize(resource)}}
  end
end
