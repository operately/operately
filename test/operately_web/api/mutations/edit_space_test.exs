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
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator})
    end

    test "company members without view access can't see a space", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())

      assert {404, res} = request(ctx.conn, space)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't edit a space", ctx do
      space = create_space(ctx, company_permissions: Binding.view_access())

      assert {403, res} = request(ctx.conn, space)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can edit a space", ctx do
      space = create_space(ctx, company_permissions: Binding.edit_access())

      assert {200, res} = request(ctx.conn, space)
      assert res.space == Serializer.serialize(space)
    end

    test "company owners can edit a space", ctx do
      space = create_space(ctx, company_permissions: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, space)

      # Admin
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, space)
      assert res.space == Serializer.serialize(space)
    end

    test "space members without edit access can't edit a space", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      add_person_to_space(ctx, space.id, Binding.comment_access())

      assert {403, res} = request(ctx.conn, space)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can edit a space", ctx do
      space = create_space(ctx, company_permissions: Binding.no_access())
      add_person_to_space(ctx, space.id, Binding.edit_access())

      assert {200, res} = request(ctx.conn, space)
      assert res.space == Serializer.serialize(space)
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
