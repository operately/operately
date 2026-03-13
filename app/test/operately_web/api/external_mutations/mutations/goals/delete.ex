defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.Delete do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/delete"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      goal_id: Paths.goal_id(ctx.goal)
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.goal.id == Paths.goal_id(ctx.goal)
    refute Map.has_key?(response, :error)
  end
end
