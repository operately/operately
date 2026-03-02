defmodule OperatelyWeb.Api.ExternalQueries.Queries.Spaces.ListMembers do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "spaces/list_members"

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
    assert is_list(res.people)
  end
end
