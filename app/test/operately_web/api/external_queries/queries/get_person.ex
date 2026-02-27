defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetPerson do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.person_id(ctx.member)}
  end

  @impl true
  def assert(response, ctx) do
    assert response.person
    assert response.person.id == Paths.person_id(ctx.member)
  end
end
