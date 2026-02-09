defmodule OperatelyWeb.Api.Mutations.AddSpaceMembersTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Groups
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_space_members, %{})
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
        space = create_group(ctx, Binding.from_atom(@test.company))
        new_member = person_fixture(%{company_id: ctx.company.id})
        add_person_to_space(ctx, space, Binding.from_atom(@test.space))

        assert {code, res} = mutation(ctx.conn, :add_space_members, %{
          space_id: Paths.space_id(space),
          members: [%{id: Paths.person_id(new_member), access_level: Binding.comment_access()}],
        })
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert Groups.is_member?(space, new_member)
          403 ->
            assert res.message == "You don't have permission to perform this action"
            refute Groups.is_member?(space, new_member)
          404 ->
            assert res.message == "The requested resource was not found"
            refute Groups.is_member?(space, new_member)
        end
      end
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

  defp create_group(ctx, company_permissions) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: company_permissions,
    })
  end

  defp add_person_to_space(ctx, space, access_level) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end

  defp add_manager_to_space(ctx, space) do
    Operately.Groups.add_members(ctx.person, space.id, [%{
      id: ctx.person.id,
      access_level: Binding.full_access(),
    }])
  end
end
