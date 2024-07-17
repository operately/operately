defmodule OperatelyWeb.Api.Mutations.CreateGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :space_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :timeframe, :timeframe
    field :targets, list_of(:create_target_input)
    field :description, :string
    field :parent_goal_id, :string
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    {:ok, space_id} = decode_id(inputs.space_id)
    {:ok, champion_id} = decode_id(inputs[:champion_id], :allow_nil)
    {:ok, reviewer_id} = decode_id(inputs[:reviewer_id], :allow_nil)
    {:ok, parent_goal_id} = decode_id(inputs[:parent_goal_id], :allow_nil)

    attrs = Map.merge(inputs, %{
      space_id: space_id,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      parent_goal_id: parent_goal_id,
    })

    {:ok, goal} = Operately.Operations.GoalCreation.run(me(conn), attrs)
    {:ok, %{goal: Serializer.serialize(goal, level: :essential)}}
  end
end
