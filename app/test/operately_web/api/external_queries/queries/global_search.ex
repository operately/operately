defmodule OperatelyWeb.Api.ExternalQueries.Queries.GlobalSearch do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space, name: "Search Project")
  end

  @impl true
  def inputs(_ctx) do
    %{query: "Search"}
  end

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.projects)
    assert is_list(response.goals)
    assert is_list(response.milestones)
    assert is_list(response.tasks)
    assert is_list(response.people)
  end
end
