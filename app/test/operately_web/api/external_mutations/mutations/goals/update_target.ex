defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.UpdateTarget do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/update_target"

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
      name: "Updated Target",
      start_value: 10,
      target_value: 20,
      unit: "Hours"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
