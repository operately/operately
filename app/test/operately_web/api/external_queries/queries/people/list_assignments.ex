defmodule OperatelyWeb.Api.ExternalQueries.Queries.People.ListAssignments do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory

  @impl true
  def query_name, do: "people/list_assignments"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, _ctx) do
    assert is_list(response.assignments)
  end
end
