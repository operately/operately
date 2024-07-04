defmodule OperatelyWeb.Api.Mutations.AddProjectContributor do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :project_id, :string
    field :person_id, :string
    field :responsibility, :string
    field :permissions, :integer
  end

  outputs do
    field :project_contributor, :project_contributor
  end

  def call(conn, inputs) do
    person = me(conn)

    {:ok, contributor} = Operately.Operations.ProjectContributorAddition.run(person, %{
      project_id: inputs.project_id,
      person_id: inputs.person_id,
      responsibility: inputs.responsibility,
      permissions: inputs.permissions,
    })

    {:ok, %{contributor: Serializer.serialize(contributor, level: :essential)}}
  end
end
