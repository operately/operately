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
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{company: :full_access,    space: :no_access,      project: :no_access,      expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, creator_id: creator.id, space_id: space.id})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)

        assert {code, res} = request(ctx.conn, project)
        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_response(res, project)

          403 ->
            assert res.message == "You don't have permission to perform this action"
            assert Projects.list_key_resources(project) == []

          404 ->
            assert res.message == "The requested resource was not found"
            assert Projects.list_key_resources(project) == []
        end
      end
    end

    test "company admins can add a key resource", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :view_access, :no_access, :no_access)

      # Not admin
      assert {403, _} = request(ctx.conn, project)
      assert Projects.list_key_resources(project) == []

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_response(res, project)
    end

    test "space managers can add a key resource", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :view_access, :no_access)

      # Not manager
      assert {403, _} = request(ctx.conn, project)
      assert Projects.list_key_resources(project) == []

      # Manager
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.full_access(),
      }])
      assert {200, res} = request(ctx.conn, project)
      assert_response(res, project)
    end

    test "champions can add a key resource", ctx do
      champion = person_fixture_with_account(%{company_id: ctx.company.id})
      space = create_space(ctx)
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: space.id,
        champion_id: champion.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.no_access(),
      })

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
      space = create_space(ctx)
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: space.id,
        reviewer_id: reviewer.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.no_access(),
      })

      # another user's request
      assert {403, _} = request(ctx.conn, project)
      assert Projects.list_key_resources(project) == []

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_response(res, project)
    end

    test "contributors without edit access can't add a key resource", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :no_access)
      contributor = create_contributor(ctx, project, Binding.comment_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {403, %{message: message}} = request(conn, project)
      assert message == "You don't have permission to perform this action"
      assert Projects.list_key_resources(project) == []
    end

    test "contributors with edit access can add a key resource", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :no_access)
      contributor = create_contributor(ctx, project, Binding.edit_access())

      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, project)
      assert_response(res, project)
    end
  end

  describe "add_key_resource functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      space = group_fixture(creator, %{company_id: ctx.company.id})

      Map.merge(ctx, %{creator: creator, creator_id: creator.id, space_id: space.id})
    end

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

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  defp create_project(ctx) do
    space = create_space(ctx)
    create_project(ctx, space, :full_access, :full_access, :no_access)
  end

  defp create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
    project = project_fixture(%{
      company_id: ctx.company.id,
      creator_id: ctx.creator.id,
      group_id: space.id,
      company_access_level: Binding.from_atom(company_members_level),
      space_access_level: Binding.from_atom(space_members_level),
    })

    if space_members_level != :no_access do
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.from_atom(space_members_level)
      }])
    end

    if project_member_level != :no_access do
      {:ok, _} = Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: ctx.person.id,
        permissions: Binding.from_atom(project_member_level),
        responsibility: "some responsibility"
      })
    end

    project
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
end
