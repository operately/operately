defmodule OperatelyWeb.Api.Mutations.AddProjectContributorTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_project_contributor, %{})
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
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {404, %{message: message}} = request(ctx.conn, %{project: project, contributor: contributor})
      assert message == "The requested resource was not found"
    end

    test "company members without full access can't add contributor to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.edit_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {403, %{message: message}} = request(ctx.conn, %{project: project, contributor: contributor})
      assert message == "You don't have permission to perform this action"
    end

    test "company members with full access can add contributor to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {200, res} = request(ctx.conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "company admins can add contributor to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      # Not admin
      assert {403, _} = request(ctx.conn, %{project: project, contributor: contributor})

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {404, %{message: message}} = request(ctx.conn, %{project: project, contributor: contributor})
      assert message == "The requested resource was not found"
    end

    test "space members without full access can't add contributor to a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.edit_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {403, %{message: message}} = request(ctx.conn, %{project: project, contributor: contributor})
      assert message == "You don't have permission to perform this action"
    end

    test "space members with full access can add contributor to a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.full_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {200, res} = request(ctx.conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "space managers can add contributor to a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      # Not manager
      assert {403, _} = request(ctx.conn, %{project: project, contributor: contributor})

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "contributors without full access can't add contributor to a project", ctx do
      project = create_project(ctx)
      new_contributor = person_fixture(%{company_id: ctx.company.id})

      contributor = create_contributor(ctx, project, Binding.edit_access())
      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, %{message: message}} = request(conn, %{project: project, contributor: new_contributor})
      assert message == "You don't have permission to perform this action"
    end

    test "contributors with full access can add contributor to a project", ctx do
      project = create_project(ctx)
      new_contributor = person_fixture(%{company_id: ctx.company.id})

      contributor = create_contributor(ctx, project, Binding.full_access())
      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: new_contributor})
      assert_contributor_created(res, new_contributor)
    end

    test "champions can add contributor to a project", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      # another user's request
      assert {403, _} = request(ctx.conn, %{project: project, contributor: contributor})

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "reviewers can add contributor to a project", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      # another user's request
      assert {403, _} = request(ctx.conn, %{project: project, contributor: contributor})

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end
  end

  describe "add_project_contributor functionality" do
    setup :register_and_log_in_account

    test "adds contributor to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {200, res} = request(ctx.conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end
  end

  #
  # Steps
  #

  defp request(conn, %{project: project, contributor: contributor}) do
    mutation(conn, :add_project_contributor, %{
      project_id: Paths.project_id(project),
      person_id: Paths.person_id(contributor),
      responsibility: "some role",
      permissions: Binding.view_access(),
    })
  end

  defp assert_contributor_created(res, person) do
    constributor = Operately.Projects.get_contributor!(res.contributor.id)
    assert constributor.person_id == person.id
  end

  #
  # Helpers
  #

  defp create_project(ctx, attrs \\ []) do
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
    {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
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
