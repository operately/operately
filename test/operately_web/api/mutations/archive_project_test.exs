defmodule OperatelyWeb.Api.Mutations.ArchiveProjectTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Projects}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :archive_project, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, creator_id: creator.id, space_id: space.id})
    end

    test "company members who don't have view access can't see a project", ctx do
      project = create_project(ctx, company_access_level: Binding.no_access())

      assert {404, %{message: message}} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert message == "The requested resource was not found"
      refute_project_archived(project)
    end

    test "company members who don't have full access can't archive a project", ctx do
      project = create_project(ctx, company_access_level: Binding.edit_access())

      assert {403, %{message: message}} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert message == "You don't have permission to perform this action"
      refute_project_archived(project)
    end

    test "company members who have full access can archive a project", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())

      assert {200, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end

    test "company admins can archive a project", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      refute_project_archived(project)

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end

    test "space members who don't have view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, %{message: message}} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert message == "The requested resource was not found"
      refute_project_archived(project)
    end

    test "space members who don't have full access can't archive a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.edit_access())

      assert {403, %{message: message}} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert message == "You don't have permission to perform this action"
      refute_project_archived(project)
    end

    test "space members who have full access can archive a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.full_access())

      assert {200, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end

    test "space managers can archive a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      refute_project_archived(project)

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end

    test "contributors who don't have full access can't archive a project", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.edit_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, %{message: message}} = mutation(conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert message == "You don't have permission to perform this action"
      refute_project_archived(project)
    end

    test "contributors who have full access can archive a project", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.full_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end

    test "champions can archive a project", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      refute_project_archived(project)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end

    test "reviewers can archive a project", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      refute_project_archived(project)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = mutation(conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end
  end

  describe "archive_project functionality" do
    setup :register_and_log_in_account

    test "archives project", ctx do
      project = create_project(ctx)
      refute project.deleted_at

      assert {200, _} = mutation(ctx.conn, :archive_project, %{project_id: Paths.project_id(project)})
      assert_project_archived(project)
    end
  end

  #
  # Steps
  #

  defp refute_project_archived(project) do
    project = Repo.reload(project)
    refute project.deleted_at
  end

  defp assert_project_archived(project) do
    refute Repo.reload(project)

    project = Repo.reload(project, with_deleted: true)
    assert project.deleted_at
  end

  #
  # Helpers
  #

  defp create_project(ctx, attrs \\ %{}) do
    project_fixture(Map.merge(%{
      company_id: ctx.company.id,
      name: "Project 1",
      creator_id: ctx[:creator_id] || ctx.person.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }, Enum.into(attrs, %{})))
  end

  defp create_contributor(ctx, project, permissions) do
    contributor = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Projects.create_contributor(ctx.creator, %{
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
      permissions: Binding.edit_access(),
    }])
  end

  defp add_manager_to_space(ctx) do
    Operately.Groups.add_members(ctx.person, ctx.space_id, [%{
      id: ctx.person.id,
      permissions: Binding.full_access(),
    }])
  end
end
