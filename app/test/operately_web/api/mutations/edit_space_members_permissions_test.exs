defmodule OperatelyWeb.Api.Mutations.EditSpaceMembersPermissionsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_space_members_permissions, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :view_access,    space: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      expected: 403},
      %{company: :full_access,    space: :no_access,      expected: 200},

      %{company: :no_access,      space: :view_access,    expected: 403},
      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 403},
      %{company: :no_access,      space: :full_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has company=#{@test.company} and space=#{@test.space}, then expect code=#{@test.expected}", ctx do
        {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.from_atom(@test.company))
        add_person_to_space(ctx.person, space.id, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, space, [
          {p1, Binding.edit_access()},
          {p2, Binding.comment_access()},
        ])
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_member_access_level(space, p1, Binding.edit_access())
            assert_member_access_level(space, p2, Binding.comment_access())
          403 ->
            assert res.message == "You don't have permission to perform this action"
            refute_member_access_level(space, p1, Binding.edit_access())
            refute_member_access_level(space, p2, Binding.comment_access())
          404 ->
            assert res.message == "The requested resource was not found"
            refute_member_access_level(space, p1, Binding.edit_access())
            refute_member_access_level(space, p2, Binding.comment_access())
        end
      end
    end
  end

  describe "edit_group functionality" do
    setup :register_and_log_in_account

    test "edits members access level", ctx do
      {space, p1, p2} = create_space_with_members(ctx)

      assert_member_access_level(space, p1, Binding.view_access())
      assert_member_access_level(space, p2, Binding.view_access())

      assert {200, res} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert res.success

      assert_member_access_level(space, p1, Binding.edit_access())
      assert_member_access_level(space, p2, Binding.comment_access())
    end
  end

  #
  # Steps
  #

  defp request(conn, space, people) do
    mutation(conn, :edit_space_members_permissions, %{
      space_id: Paths.space_id(space),
      members: Enum.map(people, fn {p, level} ->
        %{
          id: Paths.person_id(p),
          access_level: level,
        }
      end)
    })
  end

  defp assert_member_access_level(space, person, access_level) do
    context = Access.get_context!(group_id: space.id)
    group = Access.get_group!(person_id: person.id)

    assert Access.get_binding(context_id: context.id, group_id: group.id, access_level: access_level)
  end

  defp refute_member_access_level(space, person, access_level) do
    context = Access.get_context!(group_id: space.id)
    group = Access.get_group!(person_id: person.id)

    refute Access.get_binding(context_id: context.id, group_id: group.id, access_level: access_level)
  end

  #
  # Helpers
  #

  defp create_space_with_members(ctx, attrs \\ []) do
    space = group_fixture(ctx[:creator] || ctx.person, %{
      company_id: ctx.company.id,
      company_permissions: Keyword.get(attrs, :company_permissions, Binding.no_access()),
    })
    p1 = person_fixture(%{company_id: ctx.company.id})
    p2 = person_fixture(%{company_id: ctx.company.id})

    add_person_to_space(p1, space.id, Binding.view_access())
    add_person_to_space(p2, space.id, Binding.view_access())

    {space, p1, p2}
  end

  defp add_person_to_space(person, space_id, access_level) do
    Operately.Groups.add_members(person, space_id, [%{
      id: person.id,
      access_level: access_level,
    }])
  end
end
