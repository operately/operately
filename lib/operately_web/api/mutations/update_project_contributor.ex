defmodule OperatelyWeb.Api.Mutations.UpdateProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :contrib_id, :string
    field :person_id, :string
    field :responsibility, :string
    field :permissions, :integer
  end

  outputs do
    field :contributor, :project_contributor
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs.contrib_id)
    contrib = Operately.Projects.get_contributor!(id)

    {:ok, contrib} = Operately.Operations.ProjectContributorEditing.run(me(conn), contrib, inputs)

    {:ok, %{contributor: OperatelyWeb.Api.Serializer.serialize(contrib)}}
  end
end
