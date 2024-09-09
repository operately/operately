defmodule OperatelyWeb.Api.Mutations.SubscribeToNotificationsTest do
  use OperatelyWeb.TurboCase

  alias Operately.Notifications
  alias Operately.Access.Binding

  import Operately.GroupsFixtures
  import Operately.PeopleFixtures
  import Operately.ProjectsFixtures

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :subscribe_to_notifications, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :view_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 200},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 200},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :view_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 200},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 200},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :view_access,    space: :no_access,      project: :no_access,      expected: 200},
      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 200},
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
        check_in = check_in_fixture(%{author_id: ctx.person.id, project_id: project.id})
        subscription_list = Notifications.get_subscription_list!(parent_id: check_in.id)

        assert {code, res} = mutation(ctx.conn, :subscribe_to_notifications, %{
          id: Paths.subscription_list_id(subscription_list),
          type: "project_check_in",
        })

        assert code == @test.expected

        case @test.expected do
          200 -> assert Notifications.is_subscriber?(ctx.person.id, subscription_list.id)
          403 ->
            refute Notifications.is_subscriber?(ctx.person.id, subscription_list.id)
            assert res.message == "You don't have permission to perform this action"
          404 ->
            refute Notifications.is_subscriber?(ctx.person.id, subscription_list.id)
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "subscribe_to_notifications functionality" do
    setup :register_and_log_in_account
    setup ctx do
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      check_in = check_in_fixture(%{author_id: ctx.person.id, project_id: project.id})
      subscription_list = Notifications.get_subscription_list!(parent_id: check_in.id)

      Map.merge(ctx, %{subscription_list: subscription_list})
    end

    test "subscribes to check-in notifications", ctx do
      refute Notifications.is_subscriber?(ctx.person.id, ctx.subscription_list.id)

      assert {200, _} = mutation(ctx.conn, :subscribe_to_notifications, %{
        id: Paths.subscription_list_id(ctx.subscription_list),
        type: "project_check_in",
      })

      assert Notifications.is_subscriber?(ctx.person.id, ctx.subscription_list.id)
    end

    test "updates canceled subscription", ctx do
      {:ok, subscription} = Notifications.create_subscription(%{
        person_id: ctx.person.id,
        subscription_list_id: ctx.subscription_list.id,
        type: :joined
      })

      assert Notifications.is_subscriber?(ctx.person.id, ctx.subscription_list.id)

      {:ok, _} = Notifications.update_subscription(subscription, %{canceled: true})

      refute Notifications.is_subscriber?(ctx.person.id, ctx.subscription_list.id)

      assert {200, _} = mutation(ctx.conn, :subscribe_to_notifications, %{
        id: Paths.subscription_list_id(ctx.subscription_list),
        type: "project_check_in",
      })

      assert Notifications.is_subscriber?(ctx.person.id, ctx.subscription_list.id)
    end
  end

  #
  # Helpers
  #

  def create_space(ctx) do
    group_fixture(ctx.creator, %{company_id: ctx.company.id, company_permissions: Binding.no_access()})
  end

  def create_project(ctx, space, company_members_level, space_members_level, project_member_level) do
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
        permissions: Binding.from_atom(space_members_level)
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
end
