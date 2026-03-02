defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.UpdateTargetValue do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/update_target_value"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_target(:target, :goal)
  end

  @impl true
  def inputs(ctx) do
    %{
      goal_id: Paths.goal_id(ctx.goal),
      target_id: Paths.target_id(ctx.target),
      value: 1.0
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
