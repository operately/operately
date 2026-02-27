defmodule OperatelyWeb.Api.ExternalQueries.Queries.GetPeople do
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
  def assert(response, ctx) do
    assert is_list(response.people)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.creator) end)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.member) end)
  end
end
