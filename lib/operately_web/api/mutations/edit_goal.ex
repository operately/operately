defmodule OperatelyWeb.Api.Mutations.EditGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :goal_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :timeframe, :timeframe
    field :added_targets, list_of(:create_target_input)
    field :updated_targets, list_of(:update_target_input)
    field :description, :string
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    person = me(conn)
    {:ok, id} = decode_id(inputs.goal_id)

    case load_goal(person, id) do
      nil ->
        query(id)
        |> forbidden_or_not_found(person.id)

      goal ->
        {:ok, champion_id} = decode_id(inputs.champion_id)
        {:ok, reviewer_id} = decode_id(inputs.reviewer_id)

        attrs = Map.merge(inputs, %{
          champion_id: champion_id,
          reviewer_id: reviewer_id,
        })

        {:ok, goal} = Operately.Operations.GoalEditing.run(person, goal, attrs)
        {:ok, %{goal: Serializer.serialize(goal, level: :essential)}}
    end
  end

  defp load_goal(person, goal_id) do
    query(goal_id)
    |> filter_by_edit_access(person.id)
    |> Repo.one()
  end

  defp query(goal_id) do
    from(g in Operately.Goals.Goal, where: g.id == ^goal_id)
  end
end
