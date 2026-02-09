defmodule OperatelyWeb.Api.Mutations.EditSpaceTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_space, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      expected: 404},

      %{company: :view_access,    space: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      expected: 200},

      %{company: :no_access,      space: :view_access,    expected: 403},
      %{company: :no_access,      space: :comment_access, expected: 403},
      %{company: :no_access,      space: :edit_access,    expected: 200},
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
            assert res.space == Serializer.serialize(space)
          403 ->
            assert res.message == "You don't have permission to perform this action"
          404 ->
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_group functionality" do
    setup :register_and_log_in_account

    test "edits space name", ctx do
      space = group_fixture(ctx.person, %{company_id: ctx.company.id, name: "Name"})
      assert space.name == "Name"

      assert {200, res} = request(ctx.conn, space, name: "New name")
      space = Repo.reload(space)

      assert space.name == "New name"
      assert res.space == Serializer.serialize(space)
    end

    test "edits space mission", ctx do
      space = group_fixture(ctx.person, %{company_id: ctx.company.id, mission: "Mission"})
      assert space.mission == "Mission"

      assert {200, _} = request(ctx.conn, space, mission: "Edited mission")
      space = Repo.reload(space)

      assert space.mission == "Edited mission"
    end
  end

  #
  # Steps
  #

  defp request(conn, space, attrs \\ []) do
    mutation(conn, :edit_space, %{
      id: Paths.space_id(space),
      name: Keyword.get(attrs, :name, space.name),
      mission: Keyword.get(attrs, :mission, space.mission),
    })
  end

  #
  # Helpers
  #

  defp create_space(ctx, attrs) do
    group_fixture(ctx.creator, %{
      company_id: ctx.company.id,
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
