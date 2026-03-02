defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.UpdateAccessLevels do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/update_access_levels"

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
      access_levels: %{public: Operately.Access.Binding.no_access(), company: Operately.Access.Binding.edit_access(), space: Operately.Access.Binding.view_access()}
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
