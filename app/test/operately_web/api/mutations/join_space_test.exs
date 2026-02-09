defmodule OperatelyWeb.Api.Mutations.JoinSpaceTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Groups
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :join_space, %{})
    end
  end

  describe "permissions" do
    @table [
      %{permissions: :no_access, expected: 404},
      %{permissions: :view_access, expected: 403},
      %{permissions: :comment_access, expected: 403},
      %{permissions: :edit_access, expected: 200},
      %{permissions: :full_access, expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "company members with #{@test.permissions} can #{if @test.expected == 200, do: "join", else: "not join"} space", ctx do
        space = create_space(ctx, @test.permissions)

        assert {code, res} = mutation(ctx.conn, :join_space, %{space_id: Paths.space_id(space)})
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_joined_space(space, ctx.person)
          403 ->
            assert res.message == "You don't have permission to perform this action"
            refute_joined_space(space, ctx.person)
          404 ->
            assert res.message == "The requested resource was not found"
            refute_joined_space(space, ctx.person)
        end
      end
    end
  end

  describe "join_space functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{space: space})
    end

    test "person joins space", ctx do
      assert Groups.list_members(ctx.space) == [ctx.company_creator]

      assert {200, _} = mutation(ctx.conn, :join_space, %{space_id: Paths.space_id(ctx.space)})

      members = Groups.list_members(ctx.space)

      assert length(members) == 2
      assert Enum.find(members, &(&1.id == ctx.person.id))
    end
  end

  #
  # Steps
  #

  defp assert_joined_space(space, person) do
    members = Groups.list_members(space)
    assert Enum.find(members, &(&1.id == person.id))
  end

  defp refute_joined_space(space, person) do
    members = Groups.list_members(space)
    refute Enum.find(members, &(&1.id == person.id))
  end

  #
  # Helpers
  #

  defp create_space(ctx, permissions) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Binding.from_atom(permissions),
    })
  end
end
