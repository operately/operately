defmodule OperatelyWeb.Api.Queries.GetKeyResource do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
  end

  outputs do
    field :key_resource, :project_key_resource
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs[:id])
    resource = Operately.Projects.get_key_resource!(id)
    resource = Operately.Repo.preload(resource, :project)
    {:ok, %{key_resource: Serializer.serialize(resource, level: :full)}}
  end
end
