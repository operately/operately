defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetGoalCheckIns do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query "goals/get_check_ins" do
    setup &setup_goal_update/1
    inputs &get_goal_check_ins_inputs/1
    assert &assert_get_goal_check_ins/2
  end

  def setup_goal(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  def setup_goal_update(ctx) do
    ctx
    |> setup_goal()
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  def get_goal_check_ins_inputs(ctx) do
    %{goal_id: Paths.goal_id(ctx.goal)}
  end

  def assert_get_goal_check_ins(response, ctx) do
    assert is_list(response.check_ins)
    assert Enum.any?(response.check_ins, fn check_in -> check_in.id == Paths.goal_update_id(ctx.goal_update) end)
  end
end
