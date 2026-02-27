defmodule OperatelyWeb.Api.ExternalQueries.Queries.SpacesListTasks do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "spaces/list_tasks"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{space_id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(res, _ctx) do
    assert is_list(res.tasks)
  end
end
