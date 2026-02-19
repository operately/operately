defmodule OperatelyWeb.Api.Mutations.AddProjectContributorsTest do
  use OperatelyWeb.TurboCase

  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias OperatelyWeb.Paths
  alias Operately.Access.Binding
  alias Operately.Notifications
  alias Operately.Notifications.Subscription

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :add_project_contributors, %{})
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

        assert {code, res} = request(ctx.conn, %{project: project, contributors: []})
        assert code == @test.expected

        case @test.expected do
          200 -> assert code == 200
          403 -> assert res.message == "You don't have permission to perform this action"
          404 -> assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "add_project_contributors functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      creator = person_fixture(%{company_id: ctx.company.id})
      Map.merge(ctx, %{creator: creator})
    end

    test "adds multiple contributors to a project", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :full_access, :no_access, :no_access)

      person1 = person_fixture(%{company_id: ctx.company.id})
      person2 = person_fixture(%{company_id: ctx.company.id})
      person3 = person_fixture(%{company_id: ctx.company.id})

      assert {200, _} =
               request(ctx.conn, %{
                 project: project,
                 contributors: [
                   %{
                     person_id: OperatelyWeb.Paths.person_id(person1),
                     responsibility: "software development",
                     access_level: "edit_access"
                   },
                   %{
                     person_id: OperatelyWeb.Paths.person_id(person2),
                     responsibility: "software development",
                     access_level: "edit_access"
                   },
                   %{
                     person_id: OperatelyWeb.Paths.person_id(person3),
                     responsibility: "software development",
                     access_level: "edit_access"
                   }
                 ]
               })

      assert_contributor_created(project, person1)
      assert_contributor_created(project, person2)
      assert_contributor_created(project, person3)
    end

    test "it creates subscriptions for added contributors", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :full_access, :no_access, :no_access)
      contributor = person_fixture(%{company_id: ctx.company.id})

      subscription_list_id = project.subscription_list_id

      assert {:error, :not_found} =
        Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: contributor.id)

      assert {200, _} =
        request(ctx.conn, %{
          project: project,
          contributors: [
            %{
              person_id: Paths.person_id(contributor),
              responsibility: "software development",
              access_level: "edit_access"
            }
          ]
        })

      {:ok, subscription} =
        Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: contributor.id)

      assert subscription.type == :invited
      refute subscription.canceled
    end

    test "it reactivates existing contributor subscriptions", ctx do
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

      assert {200, _} =
        request(ctx.conn, %{
          project: project,
          contributors: [
            %{
              person_id: Paths.person_id(contributor),
              responsibility: "software development",
              access_level: "edit_access"
            }
          ]
        })

      {:ok, reactivated} =
        Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: contributor.id)

      assert reactivated.id == subscription.id
      refute reactivated.canceled
    end

    test "adds contributors without responsibility", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :full_access, :no_access, :no_access)

      person1 = person_fixture(%{company_id: ctx.company.id})
      person2 = person_fixture(%{company_id: ctx.company.id})
      person3 = person_fixture(%{company_id: ctx.company.id})

      assert {200, _} =
               request(ctx.conn, %{
                 project: project,
                 contributors: [
                   %{
                     person_id: OperatelyWeb.Paths.person_id(person1),
                     access_level: "edit_access"
                   },
                   %{
                     person_id: OperatelyWeb.Paths.person_id(person2),
                     access_level: "edit_access"
                   },
                   %{
                     person_id: OperatelyWeb.Paths.person_id(person3),
                     responsibility: "software development",
                     access_level: "edit_access"
                   }
                 ]
               })

      assert_contributor_created(project, person1)
      assert_contributor_created(project, person2)
      assert_contributor_created(project, person3)
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
      test "user with #{@test.caller_access} access can add members with #{@test.new_member_access} access, expect code=#{@test.expected}", ctx do
        space = create_space(ctx)
        project = create_project(ctx, space, :no_access, :no_access, :no_access)

        contributor = create_contributor(ctx, project, Binding.from_atom(@test.caller_access))
        account = Repo.preload(contributor, :account).account
        conn = log_in_account(ctx.conn, account)

        person1 = person_fixture(%{company_id: ctx.company.id})
        person2 = person_fixture(%{company_id: ctx.company.id})

        assert {code, res} =
          request(conn, %{
            project: project,
            contributors: [
              %{
                person_id: Paths.person_id(person1),
                responsibility: "software development",
                access_level: Atom.to_string(@test.new_member_access)
              },
              %{
                person_id: Paths.person_id(person2),
                responsibility: "software development",
                access_level: Atom.to_string(@test.new_member_access)
              }
            ]
          })

        assert code == @test.expected

        case @test.expected do
          200 ->
            assert_contributor_created(project, person1)
            assert_contributor_created(project, person2)
          403 ->
            assert res.message == "You don't have permission to perform this action"
        end
      end
    end

    test "fails if any contributor has higher access than caller", ctx do
      space = create_space(ctx)
      project = create_project(ctx, space, :no_access, :no_access, :no_access)

      contributor = create_contributor(ctx, project, Binding.edit_access())
      account = Repo.preload(contributor, :account).account
      conn = log_in_account(ctx.conn, account)

      person1 = person_fixture(%{company_id: ctx.company.id})
      person2 = person_fixture(%{company_id: ctx.company.id})

      assert {403, res} =
        request(conn, %{
          project: project,
          contributors: [
            %{
              person_id: Paths.person_id(person1),
              responsibility: "software development",
              access_level: "comment_access"
            },
            %{
              person_id: Paths.person_id(person2),
              responsibility: "software development",
              access_level: "full_access"
            }
          ]
        })

      assert res.message == "You don't have permission to perform this action"

      refute_contributor_created(project, person1)
      refute_contributor_created(project, person2)
    end
  end

  #
  # Steps
  #

  defp request(conn, %{project: project, contributors: contributors}) do
    mutation(conn, :add_project_contributors, %{
      project_id: Paths.project_id(project),
      contributors: contributors
    })
  end

  defp assert_contributor_created(project, person) do
    constributors = Operately.Projects.list_project_contributors(project)
    contributor = Enum.find(constributors, fn c -> c.person_id == person.id end)

    assert contributor
    assert contributor.person_id == person.id
    assert contributor.project_id == project.id
  end

  defp refute_contributor_created(project, person) do
    constributors = Operately.Projects.list_project_contributors(project)
    contributor = Enum.find(constributors, fn c -> c.person_id == person.id end)

    refute contributor
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
