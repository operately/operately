defmodule OperatelyWeb.Api.ExternalMutations.Mutations.AcknowledgeGoalProgressUpdate do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "acknowledge_goal_progress_update"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.goal_update_id(ctx.goal_update)
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.update.id == Paths.goal_update_id(ctx.goal_update)
    refute Map.has_key?(response, :error)
  end
end
