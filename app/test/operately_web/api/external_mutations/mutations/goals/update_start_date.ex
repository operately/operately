defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.UpdateStartDate do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "goals/update_start_date"

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
      start_date: date(7)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end

  defp date(days) do
    %{
      date: Date.utc_today() |> Date.add(days) |> Date.to_iso8601(),
      date_type: "day",
      value: "date"
    }
  end
end
