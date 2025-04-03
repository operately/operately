defmodule OperatelyWeb.Api.Mutations.CreateProjectTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.GoalsFixtures

  alias Operately.Access
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :create_project, %{})
    end
  end

  describe "company permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = Operately.Groups.get_group!(ctx.company.company_space_id)
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Map.merge(ctx, %{space: space, goal: goal})
    end

    test "company member can see only their company", ctx do
      other_ctx = register_and_log_in_account(ctx)

      assert {404, res} = request(other_ctx.conn, ctx)
      assert res.message == "The requested resource was not found"
    end

    test "company members without edit access can't create project", ctx do
      assert {403, res} = request(ctx.conn, ctx)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can create project", ctx do
      give_person_edit_access(ctx)

      assert {200, res} = request(ctx.conn, ctx)
      assert_project_created(res, ctx.company.company_space_id)
    end

    test "company admins can create project", ctx do
      # Not owner
      assert {403, _} = request(ctx.conn, ctx)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx)
      assert_project_created(res, ctx.company.company_space_id)
    end
  end

  describe "space permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Map.merge(ctx, %{space: space, goal: goal})
    end

    test "company member without view access can't see space", ctx do
      assert {404, res} = request(ctx.conn, ctx)
      assert res.message == "The requested resource was not found"
    end

    test "space member without edit access can't create project", ctx do
      add_person_to_space(ctx, Binding.comment_access())

      assert {403, res} = request(ctx.conn, ctx)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can create project", ctx do
      add_person_to_space(ctx, Binding.edit_access())

      assert {200, res} = request(ctx.conn, ctx)
      assert_project_created(res, ctx.space.id)
    end

    test "company admins can create project", ctx do
      # Not owner
      assert {404, _} = request(ctx.conn, ctx)

      # Owner
      {:ok, _} = Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, ctx)
      assert_project_created(res, ctx.space.id)
    end
  end

  describe "create_project functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      space = group_fixture(ctx.company_creator, %{company_id: ctx.company.id})
      goal = goal_fixture(ctx.person, %{space_id: space.id})

      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      Map.merge(ctx, %{space: space, goal: goal})
    end

    test "creates project within space", ctx do
      assert {200, res} = request(ctx.conn, ctx)
      assert_project_created(res, ctx.space.id)
    end

    test "creates project within company", ctx do
      space = Operately.Groups.get_group!(ctx.company.company_space_id)

      assert {200, res} = request(ctx.conn, ctx, space_id: Paths.space_id(space))
      assert_project_created(res, ctx.company.company_space_id)
    end
  end

  #
  # Steps
  #

  defp request(conn, ctx, attrs \\ []) do
    mutation(conn, :create_project, Enum.into(attrs, %{
      space_id: Paths.space_id(ctx.space),
      name: "project",
      reviewer_id: Paths.person_id(ctx.person),
      champion_id: Paths.person_id(ctx.person),
      creator_is_contributor: "yes",
      creator_role: "Developer",
      goal_id: Paths.goal_id(ctx.goal),
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.view_access(),
      space_access_level: Binding.edit_access(),
    }))
  end

  defp assert_project_created(res, space_id) do
    {:ok, id} = OperatelyWeb.Api.Helpers.decode_id(res.project.id)
    project = Operately.Projects.get_project!(id)
    assert project.group_id == space_id
  end

  #
  # Helpers
  #

  defp give_person_edit_access(ctx) do
    group = Access.get_group!(company_id: ctx.company.id, tag: :standard)
    context = Access.get_context!(group_id: ctx.company.company_space_id)

    Access.get_binding!(group_id: group.id, context_id: context.id)
    |> Access.update_binding(%{access_level: Binding.edit_access()})
  end

  defp add_person_to_space(ctx, access_level) do
    Operately.Groups.add_members(ctx.person, ctx.space.id, [%{
      id: ctx.person.id,
      access_level: access_level,
    }])
  end
end
