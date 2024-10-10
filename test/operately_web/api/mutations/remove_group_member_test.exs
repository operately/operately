defmodule OperatelyWeb.Api.Mutations.RemoveGroupMemberTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Groups
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :remove_group_member, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: Binding.no_access(),      space: Binding.no_access(),      expected: 404},
      %{company: Binding.no_access(),      space: Binding.comment_access(), expected: 403},
      %{company: Binding.no_access(),      space: Binding.edit_access(),    expected: 403},
      %{company: Binding.no_access(),      space: Binding.full_access(),    expected: 200},
      %{company: Binding.comment_access(), space: Binding.no_access(),      expected: 403},
      %{company: Binding.edit_access(),    space: Binding.no_access(),      expected: 403},
      %{company: Binding.full_access(),    space: Binding.no_access(),      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        space = group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: @test.company})
        member = person_fixture(%{company_id: ctx.company.id})

        # add the member that will be removed to the space
        add_member(ctx, space, member, Binding.comment_access())

        # add the caller to the space
        add_member(ctx, space, ctx.person, @test.space)

        # run the mutation
        assert {code, res} = mutation(ctx.conn, :remove_group_member, %{
          group_id: Paths.space_id(space),
          member_id: Paths.person_id(member)
        })

        assert code == @test.expected

        case @test.expected do
          200 ->
            assert res == %{}
            refute Groups.is_member?(space, member)

          403 ->
            assert res.message == "You don't have permission to perform this action"
            assert Groups.is_member?(space, member)

          404 ->
            assert res.message == "The requested resource was not found"
            assert Groups.is_member?(space, member)
        end
      end
    end
  end

  defp add_member(ctx, space, person, permissions) do
    {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{id: person.id, access_level: permissions}])
  end
end
