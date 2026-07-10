defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.AcknowledgeCheckIn do
  use Operately.Support.ExternalApi.MutationSpec

  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/acknowledge_check_in"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:person, :space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_goal_update(:goal_update, :goal, :person)
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
