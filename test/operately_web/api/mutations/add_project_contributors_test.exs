defmodule OperatelyWeb.Api.Mutations.AddProjectContributorsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_project_contributors, %{})
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

      assert {404, %{message: message}} = request(ctx.conn, %{project: project, contributors: []})
      assert message == "The requested resource was not found"
    end

    test "company members without full access can't add contributor to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.edit_access())

      assert {403, %{message: message}} = request(ctx.conn, %{project: project, contributors: []})
      assert message == "You don't have permission to perform this action"
    end

    test "company members with full access can add contributor to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())

      assert {200, _} = request(ctx.conn, %{project: project, contributors: []})
    end

    test "company admins can add contributor to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = request(ctx.conn, %{project: project, contributors: []})

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, %{project: project, contributors: []})
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, %{message: message}} = request(ctx.conn, %{project: project, contributors: []})
      assert message == "The requested resource was not found"
    end

    test "space members without full access can't add contributor to a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.edit_access())

      assert {403, %{message: message}} = request(ctx.conn, %{project: project, contributors: []})
      assert message == "You don't have permission to perform this action"
    end

    test "space members with full access can add contributor to a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.full_access())

      assert {200, _} = request(ctx.conn, %{project: project, contributors: []})
    end

    test "space managers can add contributor to a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, %{project: project, contributors: []})

      # Manager
      add_manager_to_space(ctx)
      assert {200, _} = request(ctx.conn, %{project: project, contributors: []})
    end

    test "contributors without full access can't add contributor to a project", ctx do
      project = create_project(ctx)

      contributor = create_contributor(ctx, project, Binding.edit_access())
      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, %{message: message}} = request(conn, %{project: project, contributors: []})
      assert message == "You don't have permission to perform this action"
    end

    test "contributors with full access can add contributor to a project", ctx do
      project = create_project(ctx)

      contributor = create_contributor(ctx, project, Binding.full_access())
      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, %{project: project, contributors: []})
    end

    test "champions can add contributor to a project", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, %{project: project, contributors: []})

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, %{project: project, contributors: []})
    end

    test "reviewers can add contributor to a project", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, %{project: project, contributors: []})

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, _} = request(conn, %{project: project, contributors: []})
    end
  end

  describe "add_project_contributors functionality" do
    setup :register_and_log_in_account

    test "adds multiple contributors to a project", ctx do
      project = create_project(ctx, company_access_level: Binding.full_access())

      person1 = person_fixture(%{company_id: ctx.company.id})
      person2 = person_fixture(%{company_id: ctx.company.id})
      person3 = person_fixture(%{company_id: ctx.company.id})

      assert {200, _} = request(ctx.conn, %{project: project, contributors: [
        %{
          person_id: OperatelyWeb.Paths.person_id(person1),
          responsibility: "software development",
          access_level: Binding.edit_access(),
        },
        %{
          person_id: OperatelyWeb.Paths.person_id(person2),
          responsibility: "software development",
          access_level: Binding.edit_access(),
        },
        %{
          person_id: OperatelyWeb.Paths.person_id(person3),
          responsibility: "software development",
          access_level: Binding.edit_access(),
        }
      ]})

      assert_contributor_created(project, person1)
      assert_contributor_created(project, person2)
      assert_contributor_created(project, person3)
    end
  end

  #
  # Steps
  #

  defp request(conn, %{project: project, contributors: contributors}) do
    mutation(conn, :add_project_contributors, %{
      project_id: Paths.project_id(project),
      contributors: contributors,
    })
  end

  defp assert_contributor_created(project, person) do
    constributors = Operately.Projects.list_project_contributors(project)
    contributor = Enum.find(constributors, fn c -> c.person_id == person.id end)

    assert contributor
    assert contributor.person_id == person.id
    assert contributor.project_id == project.id
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
