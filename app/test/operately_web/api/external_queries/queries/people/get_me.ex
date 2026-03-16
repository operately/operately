defmodule OperatelyWeb.Api.ExternalQueries.Queries.People.GetMe do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def query_name, do: "people/get_me"

  @impl true
  def setup(ctx), do: Factory.setup(ctx)

  @impl true
  def assert(response, ctx) do
    assert response.me
    assert response.me.id == Paths.person_id(ctx.creator)
    assert response.me.full_name == ctx.creator.full_name
    assert response.me.email == ctx.creator.email
  end
end
