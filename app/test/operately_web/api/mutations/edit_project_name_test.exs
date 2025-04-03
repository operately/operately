defmodule OperatelyWeb.Api.Mutations.EditProjectNameTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_project_name, %{})
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

    test "company members without edit access can't edit project name", ctx do
      project = create_project(ctx, company_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
    end

    test "company members with edit access can edit project name", ctx do
      project = create_project(ctx, company_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, project)
      assert_name_edited(res, project)
    end

    test "company owners can edit project name", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())

      # Not owner
      assert {403, _} = request(ctx.conn, project)

      # Admin
      Operately.Companies.add_owner(ctx.company_creator, ctx.person.id)

      assert {200, res} = request(ctx.conn, project)
      assert_name_edited(res, project)
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, res} = request(ctx.conn, project)
      assert res.message == "The requested resource was not found"
    end

    test "space members without edit access can't edit project name", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.comment_access())

      assert {403, res} = request(ctx.conn, project)
      assert res.message == "You don't have permission to perform this action"
    end

    test "space members with edit access can edit project name", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, project)
      assert_name_edited(res, project)
    end

    test "space managers can edit project name", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, project)

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, project)
      assert_name_edited(res, project)
    end

    test "contributors without edit access can't edit project name", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.comment_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, res} = request(conn, project)
      assert res.message == "You don't have permission to perform this action"
    end

    test "contributors with edit access can edit project name", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.full_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_name_edited(res, project)
    end

    test "champions can edit project name", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_name_edited(res, project)
    end

    test "reviewers can edit project name", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_name_edited(res, project)
    end
  end

  describe "edit_project_name functionality" do
    setup :register_and_log_in_account

    test "edits project name", ctx do
      project = create_project(ctx)

      assert project.name == "Name"

      assert {200, res} = request(ctx.conn, project)
      assert_name_edited(res, project)
    end
  end

  #
  # Steps
  #

  defp request(conn, project) do
    mutation(conn, :edit_project_name, %{
      project_id: Paths.project_id(project),
      name: "New name",
    })
  end

  defp assert_name_edited(res, project) do
    project = Repo.reload(project)

    assert project.name == "New name"
    assert res.project == Serializer.serialize(project)
  end

  #
  # Helpers
  #

  defp create_project(ctx, attrs \\ []) do
    project_fixture(Enum.into(attrs, %{
      company_id: ctx.company.id,
      name: "Name",
      creator_id: ctx[:creator_id] || ctx.person.id,
      group_id: ctx[:space_id] || ctx.company.company_space_id,
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access(),
    }))
  end

  defp create_contributor(ctx, project, permissions) do
    contributor = person_fixture_with_account(%{company_id: ctx.company.id})
    {:ok, _} = Operately.Projects.create_contributor(ctx.person, %{
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
