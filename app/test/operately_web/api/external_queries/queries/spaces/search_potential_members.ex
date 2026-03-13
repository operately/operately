defmodule OperatelyWeb.Api.ExternalQueries.Queries.Spaces.SearchPotentialMembers do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "spaces/search_potential_members"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    %{group_id: Paths.space_id(ctx.space)}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.people)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.member) end)
  end
end
