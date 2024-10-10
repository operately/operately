defmodule OperatelyWeb.Api.Mutations.AddKeyResourceTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.{Repo, Projects}
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_key_resource, %{})
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

      assert {404, %{message: message}} = request(ctx.conn, project)
      assert message == "The requested resource was not found"
      assert Projects.list_key_resources(project) == []
    end

    test "company members without edit access can't add a key resource", ctx do
      project = create_project(ctx, company_access_level: Binding.comment_access())

      assert {403, %{message: message}} = request(ctx.conn, project)
      assert message == "You don't have permission to perform this action"
      assert Projects.list_key_resources(project) == []
    end

    test "company members with edit access can add a key resource", ctx do
      project = create_project(ctx, company_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, project)
      assert_response(res, project)
    end

    test "company admins can add a key resource", ctx do
      project = create_project(ctx, company_access_level: Binding.view_access())

      # Not admin
      assert {403, _} = request(ctx.conn, project)
      assert Projects.list_key_resources(project) == []

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_response(res, project)
    end

    test "space members without view access can't see a project", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.no_access())

      assert {404, %{message: message}} = request(ctx.conn, project)
      assert message == "The requested resource was not found"
      assert Projects.list_key_resources(project) == []
    end

    test "space members without edit access can't add a key resource", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      assert {403, %{message: message}} = request(ctx.conn, project)
      assert message == "You don't have permission to perform this action"
      assert Projects.list_key_resources(project) == []
    end

    test "space members with edit access can add a key resource", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.edit_access())

      assert {200, res} = request(ctx.conn, project)
      assert_response(res, project)
    end

    test "space managers can add a key resource", ctx do
      add_person_to_space(ctx)
      project = create_project(ctx, space_access_level: Binding.view_access())

      # Not manager
      assert {403, _} = request(ctx.conn, project)
      assert Projects.list_key_resources(project) == []

      # Manager
      add_manager_to_space(ctx)
      assert {200, res} = request(ctx.conn, project)
      assert_response(res, project)
    end

    test "contributors without edit access can't add a key resource", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.comment_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, %{message: message}} = request(conn, project)
      assert message == "You don't have permission to perform this action"
      assert Projects.list_key_resources(project) == []
    end

    test "contributors with edit access can add a key resource", ctx do
      project = create_project(ctx)
      contributor = create_contributor(ctx, project, Binding.edit_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_response(res, project)
    end

    test "champions can add a key resource", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, champion_id: champion.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)
      assert Projects.list_key_resources(project) == []

      # champion's request
      account = Repo.preload(champion, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_response(res, project)
    end

    test "reviewers can add a key resource", ctx do
      reviewer = person_fixture_with_account(%{company_id: ctx.company.id})
      project = create_project(ctx, reviewer_id: reviewer.id, company_access_level: Binding.view_access())

      # another user's request
      assert {403, _} = request(ctx.conn, project)
      assert Projects.list_key_resources(project) == []

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_response(res, project)
    end
  end

  describe "add_key_resource functionality" do
    setup :register_and_log_in_account

    test "adds key resource", ctx do
      project = create_project(ctx)

      assert {200, res} = request(ctx.conn, project)
      assert_response(res, project)
    end
  end

  #
  # Steps
  #

  defp request(conn, project) do
    mutation(conn, :add_key_resource, %{
      project_id: Paths.project_id(project),
      title: "some title",
      link: "http://some-link.com",
      resource_type: "generic",
    })
  end

  defp assert_response(res, project) do
    assert res.key_resource.id
    assert res.key_resource.title == "some title"
    assert res.key_resource.link == "http://some-link.com"
    assert res.key_resource.resource_type == "generic"
    assert res.key_resource.project_id == Paths.project_id(project)
    assert length(Projects.list_key_resources(project)) == 1
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
