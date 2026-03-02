defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.AddTarget do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/add_target"

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
      goal_id: Paths.goal_id(ctx.goal),
      name: "Updated Name",
      start_value: 1.0,
      target_value: 1.0,
      unit: "value"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    assert response.target_id
    refute Map.has_key?(response, :error)
  end
end
