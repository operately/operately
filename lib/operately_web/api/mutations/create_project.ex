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
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    person = me(conn)

    {:ok, goal_id} = decode_id(inputs[:goal_id], :allow_nil)
    {:ok, space_id} = decode_id(inputs[:space_id], :allow_nil)
    {:ok, champion_id} = decode_id(inputs[:champion_id], :allow_nil)
    {:ok, reviewer_id} = decode_id(inputs[:reviewer_id], :allow_nil)

    args = %Operately.Operations.ProjectCreation{
      name: inputs.name,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      creator_is_contributor: inputs[:creator_is_contributor],
      creator_role: inputs[:creator_role],
      visibility: inputs.visibility,
      creator_id: person.id,
      company_id: person.company_id,
      group_id: space_id,
      goal_id: goal_id,
      anonymous_access_level: inputs.anonymous_access_level,
      company_access_level: inputs.company_access_level,
      space_access_level: inputs.space_access_level,
    }

    {:ok, project} = Operately.Projects.create_project(args)

    {:ok, %{project: Serializer.serialize(project, level: :essential)}}
  end
end
