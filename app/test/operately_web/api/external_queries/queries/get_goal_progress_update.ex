defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetGoalProgressUpdate do
  use Operately.Support.ExternalApi.QueryDefinition

  import ExUnit.Assertions

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  query :get_goal_progress_update do
    setup &setup_goal_update/1
    inputs &get_goal_progress_update_inputs/1
    assert &assert_get_goal_progress_update/2
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

  def get_goal_progress_update_inputs(ctx) do
    %{id: Paths.goal_update_id(ctx.goal_update)}
  end

  def assert_get_goal_progress_update(response, ctx) do
    assert response.update
    assert response.update.id == Paths.goal_update_id(ctx.goal_update)
  end
end
