defmodule OperatelyWeb.Api.Mutations.AddProjectContributorTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Repo
  alias Operately.Access.Binding
  alias Operately.Notifications
  alias Operately.Notifications.Subscription

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_project_contributor, %{})
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
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @table do
      test "if caller has levels company=#{@test.company}, space=#{@test.space}, project=#{@test.project} on the project, then expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, @test.company, @test.space, @test.project)
        contributor = person_fixture(%{company_id: ctx.company.id})

        assert {code, res} = request(ctx.conn, %{project: project, contributor: contributor})
        assert code == @test.expected

        case @test.expected do
          200 -> assert_contributor_created(res, contributor)
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end

    test "company admins can add contributor to a project", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :view_access, :no_access, :no_access)
      contributor = person_fixture(%{company_id: ctx.company.id})

      # Not admin
      assert {403, _} = request(ctx.conn, %{project: project, contributor: contributor})

      # Admin
      account = Repo.preload(ctx.company_creator, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "space managers can add contributor to a project", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :view_access, :no_access)
      contributor = person_fixture(%{company_id: ctx.company.id})

      # Not manager
      assert {403, _} = request(ctx.conn, %{project: project, contributor: contributor})

      # Manager
      {:ok, _} = Operately.Groups.add_members(ctx.creator, space.id, [%{
        id: ctx.person.id,
        access_level: Binding.full_access(),
      }])
      assert {200, res} = request(ctx.conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "champions can add contributor to a project", ctx do
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
      space = create_space(ctx)
      project = project_fixture(%{
        company_id: ctx.company.id,
        creator_id: ctx.creator.id,
        group_id: space.id,
        reviewer_id: reviewer.id,
        company_access_level: Binding.view_access(),
        space_access_level: Binding.no_access(),
      })
      contributor = person_fixture(%{company_id: ctx.company.id})

      # another user's request
      assert {403, _} = request(ctx.conn, %{project: project, contributor: contributor})

      # reviewer's request
      account = Repo.preload(reviewer, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "contributors with edit access can add contributor to a project", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :no_access)
      new_contributor = person_fixture(%{company_id: ctx.company.id})

      contributor = create_contributor(ctx, project, Binding.edit_access())
      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: new_contributor})
      assert_contributor_created(res, new_contributor)
    end

    test "contributors with full access can add contributor to a project", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :no_access)
      new_contributor = person_fixture(%{company_id: ctx.company.id})

      contributor = create_contributor(ctx, project, Binding.full_access())
      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      assert {200, res} = request(conn, %{project: project, contributor: new_contributor})
      assert_contributor_created(res, new_contributor)
    end
  end

  describe "permission level validation" do
    @permission_table [
      %{caller_access: :edit_access,    new_member_access: :full_access,    expected: 403},
      %{caller_access: :edit_access,    new_member_access: :edit_access,    expected: 200},
      %{caller_access: :edit_access,    new_member_access: :comment_access, expected: 200},
      %{caller_access: :edit_access,    new_member_access: :view_access,    expected: 200},

      %{caller_access: :full_access,    new_member_access: :full_access,    expected: 200},
      %{caller_access: :full_access,    new_member_access: :edit_access,    expected: 200},
      %{caller_access: :full_access,    new_member_access: :comment_access, expected: 200},
      %{caller_access: :full_access,    new_member_access: :view_access,    expected: 200},
    ]

    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    tabletest @permission_table do
      test "user with #{@test.caller_access} access can add member with #{@test.new_member_access} access, expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, :no_access, :no_access, :no_access)
        new_contributor = person_fixture(%{company_id: ctx.company.id})

        contributor = create_contributor(ctx, project, Binding.from_atom(@test.caller_access))
        account = Repo.preload(contributor, :account).account
        conn = log_in_account(ctx.conn, account)

        assert {code, res} = request(conn, %{project: project, contributor: new_contributor, permissions: Atom.to_string(@test.new_member_access)})
        assert code == @test.expected

        case @test.expected do
          200 -> assert_contributor_created(res, new_contributor)
          403 -> assert res.message == "You don't have permission to perform this action"
        end
      end
    end
  end

  describe "add_project_contributor functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    test "adds contributor to a project", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :full_access, :no_access, :no_access)
      contributor = person_fixture(%{company_id: ctx.company.id})

      assert {200, res} = request(ctx.conn, %{project: project, contributor: contributor})
      assert_contributor_created(res, contributor)
    end

    test "creates a subscription for the added contributor", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :full_access, :no_access, :no_access)
      contributor = person_fixture(%{company_id: ctx.company.id})

      subscription_list_id = project.subscription_list_id

      assert {:error, :not_found} =
        Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: contributor.id)

      assert {200, _} = request(ctx.conn, %{project: project, contributor: contributor})

      {:ok, subscription} =
        Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: contributor.id)

      assert subscription.type == :invited
      refute subscription.canceled
    end

    test "reactivates an existing contributor subscription", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :full_access, :no_access, :no_access)
      contributor = person_fixture(%{company_id: ctx.company.id})

      subscription_list_id = project.subscription_list_id

      {:ok, subscription} =
        Notifications.create_subscription(%{
          subscription_list_id: subscription_list_id,
          person_id: contributor.id,
          type: :invited,
          canceled: true
        })

      assert subscription.canceled

      assert {200, _} = request(ctx.conn, %{project: project, contributor: contributor})

      {:ok, reactivated} =
        Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: contributor.id)

      assert reactivated.id == subscription.id
      refute reactivated.canceled
    end
  end

  #
  # Steps
  #

  defp request(conn, %{project: project, contributor: contributor, permissions: permissions}) do
    mutation(conn, :add_project_contributor, %{
      project_id: Paths.project_id(project),
      person_id: Paths.person_id(contributor),
      responsibility: "some role",
      permissions: permissions,
      role: "contributor"
    })
  end

  defp request(conn, %{project: project, contributor: contributor}) do
    mutation(conn, :add_project_contributor, %{
      project_id: Paths.project_id(project),
      person_id: Paths.person_id(contributor),
      responsibility: "some role",
      permissions: "view_access",
      role: "contributor"
    })
  end

  defp assert_contributor_created(res, person) do
    constributor = Operately.Projects.get_contributor!(res.contributor.id)
    assert constributor.person_id == person.id
  end

  #
  # Helpers
  #

  defp create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
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
      {:ok, _} = Operately.Projects.create_contributor(ctx.creator, %{
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

    {:ok, _} =
      Operately.Projects.create_contributor(ctx.creator, %{
        project_id: project.id,
        person_id: contributor.id,
        responsibility: "some responsibility",
        permissions: permissions
      })

    contributor
  end
end
