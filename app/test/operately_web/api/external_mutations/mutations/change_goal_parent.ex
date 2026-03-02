defmodule OperatelyWeb.Api.ExternalMutations.Mutations.ChangeGoalParent do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "change_goal_parent"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal(:parent_goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      goal_id: Paths.goal_id(ctx.goal),
      parent_goal_id: Paths.goal_id(ctx.parent_goal)
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.goal.id == Paths.goal_id(ctx.goal)
    refute Map.has_key?(response, :error)
  end
end
