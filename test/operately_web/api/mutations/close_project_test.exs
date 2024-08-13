defmodule OperatelyWeb.Api.Mutations.CloseProjectTest do
  use OperatelyWeb.TurboCase

  import Operately.Support.RichText
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.{Repo, Projects, Companies}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :close_project, %{})
    end
  end

  describe "permissions" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, creator_id: creator.id, space_id: space.id})
    end

    test "company members without view access can't see a project", ctx do
      project = create_project(ctx, company_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, project)
      assert res.message == "The requested resource was not found"
      assert_project_not_closed(project)
    end

    test "company members without full access can't close a project", ctx do
      project = create_project(ctx, company_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
      assert_project_not_closed(project)
    end

    test "company members with full access can close a project", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())

      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "company admins can close a project", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # Admin
      {:ok, _} = Companies.add_admin(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, project)
      assert res.message == "The requested resource was not found"
      assert_project_not_closed(project)
    end

    test "space members without full access can't close a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.edit_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
      assert_project_not_closed(project)
    end

    test "space members with full access can close a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.full_access())

      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "space managers can close a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, project)
      assert_project_closed(res, project)
    end

    test "contributors without full access can't close a project", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.edit_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, res} = request(conn, project)
      assert res.message == "You don't have permission to perform this action"
      assert_project_not_closed(project)
    end

    test "contributors with full access can close a project", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.full_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_project_closed(res, project)
    end

    test "champions can close a project", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_project_closed(res, project)
    end

    test "reviewers can close a project", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)
      assert_project_not_closed(project)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_project_closed(res, project)
    end
  end

  describe "close_project functionality" do
    setup :register_and_log_in_account

    test "closes project", ctx do
      project = create_project(ctx)

      assert_project_not_closed(project)

      assert {200, res} = request(ctx.conn, project)

      assert_project_closed(res, project)
    end
  end

  #
  # Steps
  #

  defp request(conn, project) do
    mutation(conn, :close_project, %{
      project_id: Paths.project_id(project),
      retrospective: rich_text("some content") |> Jason.encode!(),
    })
  end

  defp assert_project_not_closed(project) do
    project = Repo.reload(project)

    refute project.retrospective
    refute project.closed_at
    refute project.closed_by_id
    assert project.status == "active"
  end

  defp assert_project_closed(res, project) do
    project = Repo.reload(project)

    assert project.retrospective
    assert project.closed_at
    assert project.closed_by_id
    assert project.status == "closed"
    assert res.project == Serializer.serialize(project)
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
