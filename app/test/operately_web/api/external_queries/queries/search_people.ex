defmodule OperatelyWeb.Api.ExternalQueries.Queries.SearchPeople do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:john, name: "John Doe")
  end

  @impl true
  def inputs(_ctx) do
    %{query: "John", ignored_ids: [], search_scope_type: "company"}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.people)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.john) end)
  end
end
