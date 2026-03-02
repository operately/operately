defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.UpdateParentGoal do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/update_parent_goal"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_goal(:goal, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      goal_id: Paths.goal_id(ctx.goal),
      goal_name: nil,
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
