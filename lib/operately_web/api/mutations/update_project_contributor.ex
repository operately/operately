defmodule OperatelyWeb.Api.Mutations.UpdateProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :contrib_id, :string
    field :person_id, :string
    field :responsibility, :string
  end

  outputs do
    field :contributor, :project_contributor
  end

  def call(_conn, inputs) do
    {:ok, id} = decode_id(inputs.contrib_id)
    contrib = Operately.Projects.get_contributor!(id)

    {:ok, contrib} = Operately.Projects.update_contributor(contrib, %{
      person_id: inputs.person_id,
      responsibility: inputs.responsibility
    })

    {:ok, %{contributor: OperatelyWeb.Api.Serializer.serialize(contrib)}}
  end
end
