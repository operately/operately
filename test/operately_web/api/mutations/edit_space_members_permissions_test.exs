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
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "company members without view access can't see space", ctx do
      {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.no_access())

      assert {404, res} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert res.message == "The requested resource was not found"
      refute_member_access_level(space, p1, Binding.edit_access())
      refute_member_access_level(space, p2, Binding.comment_access())
    end

    test "company members without full access can't edit members permissions", ctx do
      {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.edit_access())

      assert {403, res} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert res.message == "You don't have permission to perform this action"
      refute_member_access_level(space, p1, Binding.edit_access())
      refute_member_access_level(space, p2, Binding.comment_access())
    end

    test "company members with full access can edit members permissions", ctx do
      {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.full_access())

      assert {200, _} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert_member_access_level(space, p1, Binding.edit_access())
      assert_member_access_level(space, p2, Binding.comment_access())
    end

    test "company admins can edit members permissions", ctx do
      {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.view_access())

      # Not admin
      assert {403, _} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      refute_member_access_level(space, p1, Binding.edit_access())
      refute_member_access_level(space, p2, Binding.comment_access())

      # Admin
      Operately.Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, _} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert_member_access_level(space, p1, Binding.edit_access())
      assert_member_access_level(space, p2, Binding.comment_access())
    end

    test "space members without full access can't edit members permissions", ctx do
      {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.no_access())
      add_person_to_space(ctx.person, space.id, Binding.comment_access())

      assert {403, res} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert res.message == "You don't have permission to perform this action"
      refute_member_access_level(space, p1, Binding.edit_access())
      refute_member_access_level(space, p2, Binding.comment_access())
    end

    test "space members with full access can edit members permissions", ctx do
      {space, p1, p2} = create_space_with_members(ctx, company_permissions: Binding.no_access())
      add_person_to_space(ctx.person, space.id, Binding.full_access())

      assert {200, _} = request(ctx.conn, space, [
        {p1, Binding.edit_access()},
        {p2, Binding.comment_access()},
      ])
      assert_member_access_level(space, p1, Binding.edit_access())
      assert_member_access_level(space, p2, Binding.comment_access())
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
      group_id: Paths.space_id(space),
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
      permissions: access_level,
    }])
  end
end
