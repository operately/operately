defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.CreateCheck do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/create_check"

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
      name: "Updated Name"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    assert response.check_id
    refute Map.has_key?(response, :error)
  end
end
