defmodule OperatelyWeb.Api.Mutations.AddSpaceMembersTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Groups}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_space_members, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "company members without view access can't see space", ctx do
      space = create_group(ctx, Binding.no_access())
      new_member = person_fixture(%{company_id: ctx.company.id})

      assert {404, %{message: message}} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      assert message == "The requested resource was not found"
      refute Groups.is_member?(space, new_member)
    end

    test "company members without full access can't add members to space", ctx do
      space = create_group(ctx, Binding.edit_access())
      new_member = person_fixture(%{company_id: ctx.company.id})

      assert {403, %{message: message}} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      assert message == "You don't have permission to perform this action"
      refute Groups.is_member?(space, new_member)
    end

    test "company members with full access can add members to space", ctx do
      space = create_group(ctx, Binding.full_access())
      new_member = person_fixture(%{company_id: ctx.company.id})

      assert {200, _} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      assert Groups.is_member?(space, new_member)
    end

    test "company admins can add members to space", ctx do
      space = create_group(ctx, Binding.view_access())
      new_member = person_fixture(%{company_id: ctx.company.id})

      # Not admin
      assert {403, _} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      refute Groups.is_member?(space, new_member)

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      assert Groups.is_member?(space, new_member)
    end

    test "space members without full access can't add members to space", ctx do
      space = create_group(ctx)
      new_member = person_fixture(%{company_id: ctx.company.id})
      add_person_to_space(ctx, space)

      assert {403, _} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      refute Groups.is_member?(space, new_member)
    end

    test "space managers can add members to space", ctx do
      space = create_group(ctx)
      new_member = person_fixture(%{company_id: ctx.company.id})

      # Not manager
      assert {403, _} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      refute Groups.is_member?(space, new_member)

      # Manager
      add_manager_to_space(ctx, space)
      assert {200, _} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      assert Groups.is_member?(space, new_member)
    end
  end

  describe "add_space_members functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      add_manager_to_space(ctx, space)

      Map.merge(ctx, %{space: space})
    end

    test "adds one member", ctx do
      new_member = person_fixture(%{company_id: ctx.company.id})

      refute Groups.is_member?(ctx.space, new_member)

      assert {200, _} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(ctx.space),
        members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
      })
      assert Groups.is_member?(ctx.space, new_member)
    end

    test "adds multiple members", ctx do
      people = Enum.map(1..3, fn _ -> person_fixture(%{company_id: ctx.company.id}) end)
      new_members = Enum.map(people, fn p -> %{id: Paths.person_id(p), access_level: Binding.comment_access()} end)

      Enum.each(people, fn p ->
        refute Groups.is_member?(ctx.space, p)
      end)

      assert {200, _} = mutation(ctx.conn, :add_space_members, %{
        space_id: Paths.space_id(ctx.space),
        members: new_members,
      })
      Enum.each(people, fn p ->
        assert Groups.is_member?(ctx.space, p)
      end)
    end
  end

  #
  # Helpers
  #

  defp create_group(ctx, company_permissions \\ Binding.view_access()) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: company_permissions,
    })
  end

  defp add_person_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.full_access(),
    }])
  end
end
