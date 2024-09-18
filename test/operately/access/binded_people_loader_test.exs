defmodule Operately.Access.BindedPeopleLoaderTest do
  use Operately.DataCase

  alias Operately.Access.BindedPeopleLoader
  alias Operately.Support.Factory
  alias Operately.Projects.Project

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:silvia)
    |> Factory.add_space(:product_space)
    |> Factory.add_space_member(:mike, :product_space)
    |> Factory.add_space_member(:jane, :product_space)
    |> Factory.add_project(:hello, :product_space)
    |> Factory.add_project_contributor(:champion, :hello)
  end

  test "load/1 returns all people bound to the context", ctx do
    context = Project.get_access_context(ctx.hello)
    people = BindedPeopleLoader.load(context.id)

    assert length(people) == 5
    assert_includes_person people, ctx.mike.id
    assert_includes_person people, ctx.jane.id
    assert_includes_person people, ctx.silvia.id
    assert_includes_person people, ctx.creator.id
    assert_includes_person people, ctx.champion.person_id
  end

  def assert_includes_person(people, person_id) do
    assert Enum.any?(people, fn p -> p.id == person_id end)
  end
end
