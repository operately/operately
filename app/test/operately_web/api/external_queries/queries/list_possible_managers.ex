defmodule OperatelyWeb.Api.ExternalQueries.Queries.ListPossibleManagers do
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
    %{user_id: Paths.person_id(ctx.creator)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.people)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.member) end)
  end
end
