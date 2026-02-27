defmodule OperatelyWeb.Api.ExternalQueries.Queries.ListGoalContributors do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_goal(:goal, :space)
    |> Factory.add_project(:project, :space, goal: :goal)
    |> Factory.add_project_contributor(:contributor, :project, :as_person)
  end

  @impl true
  def inputs(ctx) do
    %{goal_id: Paths.goal_id(ctx.goal)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.contributors)
    assert Enum.any?(response.contributors, fn person -> person.id == Paths.person_id(ctx.contributor) end)
  end
end
