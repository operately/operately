defmodule OperatelyWeb.Api.Mutations.EditSpacePermissionsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_space_permissions, %{})
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
        space = create_space(ctx, company_permissions: Binding.from_atom(@test.company))
        add_person_to_space(ctx, space.id, Binding.from_atom(@test.space))

        assert {code, res} = request(ctx.conn, space)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert res.success
          403 ->
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_space_permissions functionality" do
    setup :register_and_log_in_account

    test "edits space permissions", ctx do
      space = group_fixture(ctx.person, %{
        public_permissions: Binding.view_access(),
        company_permissions: Binding.edit_access(),
      })

      assert {200, res} = request(ctx.conn, space)
      assert res.success
      assert_permissions_edited(ctx, space)
    end
  end

  #
  # Steps
  #

  defp request(conn, space) do
    mutation(conn, :edit_space_permissions, %{
      space_id: Paths.space_id(space),
      access_levels: %{
        public: Binding.no_access(),
        company: Binding.view_access(),
      },
    })
  end

  defp assert_permissions_edited(ctx, space) do
    context = Access.get_context!(group_id: space.id)
    anonymoys_group = Access.get_group!(company_id: ctx.company.id, tag: :anonymous)
    members_group = Access.get_group!(company_id: ctx.company.id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: anonymoys_group.id, access_level: Binding.no_access())
    assert Access.get_binding(context_id: context.id, group_id: members_group.id, access_level: Binding.view_access())
  end

  #
  # Helpers
  #

  defp create_space(ctx, attrs) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      public_permissions: Keyword.get(attrs, :public_permissions, Binding.no_access()),
      company_permissions: Keyword.get(attrs, :company_permissions, Binding.no_access()),
    })
  end

  defp add_person_to_space(ctx, space_id, access_level) do
    Operately.Groups.add_members(ctx.person, space_id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end
end
