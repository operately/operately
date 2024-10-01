defmodule OperatelyWeb.Api.Queries.GetBindedPeopleTest do
  use OperatelyWeb.TurboCase

  alias Operately.Support.Factory

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

  test "no access to not logged in users", ctx do
    assert {401, _} = query(ctx.conn, :get_binded_people, %{
      resourse_type: "project",
      resourse_id: Paths.project_id(ctx.hello)
    })
  end

  test "loading binded people for a project", ctx do
    ctx = log_in_account(ctx, ctx.mike)

    assert {200, result} = query(ctx.conn, :get_binded_people, %{
      resourse_type: "project",
      resourse_id: Paths.project_id(ctx.hello)
    })

    assert length(result.people) == 5
    assert_includes_person result.people, ctx.mike.id, :edit_access
    assert_includes_person result.people, ctx.jane.id, :edit_access
    assert_includes_person result.people, ctx.silvia.id, :edit_access
    assert_includes_person result.people, ctx.creator.id, :full_access
    assert_includes_person result.people, ctx.champion.person_id, :edit_access
  end

  test "when user is not binded to the project it should return not found", ctx do
    ctx = Factory.edit_project_company_members_access(ctx, :hello, :no_access)
    ctx = log_in_account(ctx, ctx.silvia)

    assert {404, _} = query(ctx.conn, :get_binded_people, %{
      resourse_type: "project",
      resourse_id: Paths.project_id(ctx.hello)
    })
  end

  defp assert_includes_person(people, person_id, access_level) do
    person = Operately.People.get_person!(person_id)
    returned_person = Enum.find(people, fn p -> p.id == Paths.person_id(person) end)

    assert returned_person != nil
    assert returned_person.access_level == Operately.Access.Binding.from_atom(access_level)
  end

end
