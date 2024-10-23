defmodule OperatelyWeb.Api.Mutations.EditProjectPermissionsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.{Access, Projects}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_project_permissions, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator_id: creator.id, space_id: space.id})
    end

    test "company members without view access can't see a project", ctx do
      project = create_project(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, project)
      assert res.message == "The requested resource was not found"
    end

    test "company members without full access can't edit project permissions", ctx do
      project = create_project(ctx, company_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with full access can edit project permissions", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())

      assert {200, res} = request(ctx.conn, project)
      assert res.success
    end

    test "company owners can edit project permissions", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, project)

      # Owner
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, project)
      assert res.success
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, project)
      assert res.message == "The requested resource was not found"
    end

    test "space members without full access can't edit project permissions", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with full access can edit project permissions", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.full_access())

      assert {200, res} = request(ctx.conn, project)
      assert res.success
    end

    test "space managers can edit project permissions", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, project)

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, project)
      assert res.success
    end

    test "contributors without full access can't edit project permissions", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.edit_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, res} = request(conn, project)
      assert res.message == "You don't have permission to perform this action"
    end

    test "contributors with full access can edit project permissions", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.full_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert res.success
    end

    test "champions can edit project permissions", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert res.success
    end

    test "reviewers can edit project permissions", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert res.success
    end
  end

  describe "edit_project_permissions functionality" do
    setup :register_and_log_in_account

    test "edits project permissions", ctx do
      space = group_fixture(ctx.person, %{company_id: ctx.company.id})
      project = create_project(ctx, group_id: space.id)

      assert {200, res} = request(ctx.conn, project)
      assert res.success

      assert_access_levels(project, [
        public: Binding.view_access(),
        company: Binding.comment_access(),
        space: Binding.edit_access(),
      ])
    end
  end

  #
  # Steps
  #

  defp request(conn, project) do
    mutation(conn, :edit_project_permissions, %{
      project_id: Paths.project_id(project),
      access_levels: %{
        public: Binding.view_access(),
        company: Binding.comment_access(),
        space: Binding.edit_access(),
      },
    })
  end

  defp assert_access_levels(project, levels) do
    context = Access.get_context!(project_id: project.id)

    anonymous_group = Access.get_group!(company_id: project.company_id, tag: :anonymous)
    company_group = Access.get_group!(company_id: project.company_id, tag: :standard)
    space_group = Access.get_group!(group_id: project.group_id, tag: :standard)

    assert Access.get_binding(context_id: context.id, group_id: anonymous_group.id, access_level: Keyword.get(levels, :public))
    assert Access.get_binding(context_id: context.id, group_id: company_group.id, access_level: Keyword.get(levels, :company))
    assert Access.get_binding(context_id: context.id, group_id: space_group.id, access_level: Keyword.get(levels, :space))
  end

  #
  # Helpers
  #

  defp create_project(ctx, attrs \\ []) do
    project_fixture(Enum.into(attrs, %{
      company_id: ctx.company.id,
      name: "Project 1",
      creator_id: ctx[:creator_id] || ctx.person.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
  end

  defp create_contributor(ctx, project, permissions) do
    contributor = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Projects.create_contributor(ctx.person, %{
      project_id: project.id,
      person_id: contributor.id,
      responsibility: "some responsibility",
      permissions: permissions,
    })
    contributor
  end

  defp add_person_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      access_level: Binding.full_access(),
    }])
  end
end
