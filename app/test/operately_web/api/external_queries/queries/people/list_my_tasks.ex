defmodule OperatelyWeb.Api.ExternalQueries.Queries.People.ListMyTasks do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  @impl true
  def query_name, do: "people/list_my_tasks"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.tasks)
  end
end
