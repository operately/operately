defmodule OperatelyWeb.Api.Mutations.RemoveProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :contrib_id, :string
  end

  outputs do
    field :project_contributor, :project_contributor
  end

  def call(conn, inputs) do
    person = me(conn)

    {:ok, contributor} = Operately.Operations.ProjectContributorRemoving.run(person, inputs.contrib_id)

    {:ok, %{contributor: Serializer.serialize(contributor, level: :essential)}}
  end
end
