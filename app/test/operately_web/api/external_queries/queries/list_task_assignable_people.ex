defmodule OperatelyWeb.Api.ExternalQueries.Queries.ListTaskAssignablePeople do
  use Operately.Support.ExternalApi.QuerySpec

  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_space_member(:member, :space)
  end

  @impl true
  def inputs(ctx) do
    %{id: Paths.project_id(ctx.project), type: "project"}
  end

  @impl true
  def assert(response, ctx) do
    assert is_list(response.people)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.creator) end)
    assert Enum.any?(response.people, fn person -> person.id == Paths.person_id(ctx.member) end)
  end
end
