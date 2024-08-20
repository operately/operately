defmodule OperatelyWeb.Api.Mutations.UpdateGroupAppearanceTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_group, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},
      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 200},
      %{company: :no_access,      space: :full_access,    expected: 200},
      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company} and space=#{@test.space} on the space, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx, company_permissions: @test.company)
        add_person_to_space(ctx, ctx.person, space.id, permissions: @test.space)

        assert {code, res} = mutation(ctx.conn, :update_group_appearance, %{
          id: Paths.space_id(space),
          icon: "IconBuilding",
          color: "text-blue-500",
        })

        assert code == @test.expected
        space = Operately.Repo.reload(space)
        
        case @test.expected do
          200 -> 
            assert res == %{space: Serializer.serialize(space)}
            assert space.icon == "IconBuilding"
            assert space.color == "text-blue-500"

          403 -> 
            assert res.message == "You don't have permission to perform this action"

          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  #
  # Steps
  #

  defp create_space(ctx, company_permissions: permission) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
      company_permissions: Binding.from_atom(permission),
    })
  end

  defp add_person_to_space(ctx, person, space_id, permissions: access_level) do
    Operately.Groups.add_members(ctx.creator, space_id, [%{
      id: person.id,
      permissions: Binding.from_atom(access_level),
    }])
  end
end 
