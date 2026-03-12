defmodule OperatelyWeb.Api.ExternalQueries.Queries.Goals.ListCheckIns do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "goals/list_check_ins"

  @impl true
  def setup(ctx) do
    ctx
    |> setup_goal()
    |> Factory.add_goal_update(:goal_update, :goal, :creator)
  end

  @impl true
  def inputs(ctx) do
    %{goal_id: Paths.goal_id(ctx.goal)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.check_ins)
    assert Enum.any?(response.check_ins, fn check_in -> check_in.id == Paths.goal_update_id(ctx.goal_update) end)
  end

  defp setup_goal(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
  end
end
