defmodule OperatelyWeb.Api.Mutations.CreateProject do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :visibility, :string
    field :creator_is_contributor, :string
    field :creator_role, :string
    field :goal_id, :string
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)
    
    {:ok, space_id} = decode_id(inputs.space_id, :allow_nil)

    args = %Operately.Operations.ProjectCreation{
      name: inputs.name,
      champion_id: inputs.champion_id,
      reviewer_id: inputs.reviewer_id,
      creator_is_contributor: inputs[:creator_is_contributor],
      creator_role: inputs[:creator_role],
      visibility: inputs.visibility,
      creator_id: person.id,
      company_id: person.company_id,
      group_id: space_id,
      goal_id: inputs[:goal_id]
    }
    
    {:ok, project} = Operately.Projects.create_project(args)

    {:ok, %{project: Serializer.serialize(project, level: :essential)}}
  end
end
