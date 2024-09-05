defmodule OperatelyWeb.Api.Mutations.EditSubscriptionsListTest do
  use OperatelyWeb.TurboCase

  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures

  alias Operately.Repo
  alias Operately.Notifications
  alias Operately.Access.Binding

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :edit_subscriptions_list, %{})
    end
  end

  describe "permissions" do
    @table [
      %{company: :no_access,      space: :no_access,      project: :no_access,      expected: 404},
      %{company: :no_access,      space: :no_access,      project: :view_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :comment_access, expected: 403},
      %{company: :no_access,      space: :no_access,      project: :edit_access,    expected: 403},
      %{company: :no_access,      space: :no_access,      project: :full_access,    expected: 200},

      %{company: :no_access,      space: :view_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :comment_access, project: :no_access,      expected: 403},
      %{company: :no_access,      space: :edit_access,    project: :no_access,      expected: 403},
      %{company: :no_access,      space: :full_access,    project: :no_access,      expected: 200},

      %{company: :view_access,    space: :no_access,      project: :no_access,      expected: 403},
      %{company: :comment_access, space: :no_access,      project: :no_access,      expected: 403},
      %{company: :edit_access,    space: :no_access,      project: :no_access,      expected: 403},
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
        check_in = check_in_fixture(%{author_id: ctx.creator.id, project_id: project.id})
        subscription_list = Notifications.get_subscription_list!(parent_id: check_in.id)

        assert {code, res} = mutation(ctx.conn, :edit_subscriptions_list, %{
          id: Paths.subscription_list_id(subscription_list),
          type: "project_check_in",
          send_notifications_to_everyone: true,
          subscriber_ids: [],
        })

        assert code == @test.expected

        subscription_list = Repo.reload(subscription_list)

        case @test.expected do
          200 -> assert subscription_list.send_to_everyone
          403 ->
            refute subscription_list.send_to_everyone
            assert res.message == "You don't have permission to perform this action"
          404 ->
            refute subscription_list.send_to_everyone
            assert res.message == "The requested resource was not found"
        end
      end
    end
  end

  describe "edit_subscriptions_list functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)
      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      check_in = check_in_fixture(%{author_id: ctx.person.id, project_id: project.id})
      subscriptions_list = Notifications.get_subscription_list!(parent_id: check_in.id)

      Map.merge(ctx, %{subscriptions_list: subscriptions_list})
    end

    test "edits send_to_everyone field", ctx do
      subscriptions_list = Repo.reload(ctx.subscriptions_list)
      refute subscriptions_list.send_to_everyone

      assert {200, _} = mutation(ctx.conn, :edit_subscriptions_list, %{
        id: Paths.subscription_list_id(subscriptions_list),
        type: "project_check_in",
        send_notifications_to_everyone: true,
        subscriber_ids: [],
      })

      subscriptions_list = Repo.reload(ctx.subscriptions_list)
      assert subscriptions_list.send_to_everyone

      assert {200, _} = mutation(ctx.conn, :edit_subscriptions_list, %{
        id: Paths.subscription_list_id(subscriptions_list),
        type: "project_check_in",
        send_notifications_to_everyone: false,
        subscriber_ids: [],
      })

      subscriptions_list = Repo.reload(ctx.subscriptions_list)
      refute subscriptions_list.send_to_everyone
    end

    test "adds new subscriptions", ctx do
      people = create_people(ctx)

      assert {200, _} = mutation(ctx.conn, :edit_subscriptions_list, %{
        id: Paths.subscription_list_id(ctx.subscriptions_list),
        type: "project_check_in",
        send_notifications_to_everyone: true,
        subscriber_ids: Enum.map(people, &(Paths.person_id(&1))),
      })

      Enum.each(people, fn p ->
        assert Notifications.is_subscriber?(p.id, ctx.subscriptions_list.id)
      end)
    end

    test "removes subscriptions", ctx do
      people = create_people(ctx)
      subscribe_people(ctx, people)

      Enum.each(people, fn p ->
        assert Notifications.is_subscriber?(p.id, ctx.subscriptions_list.id)
      end)

      assert {200, _} = mutation(ctx.conn, :edit_subscriptions_list, %{
        id: Paths.subscription_list_id(ctx.subscriptions_list),
        type: "project_check_in",
        send_notifications_to_everyone: true,
        subscriber_ids: [],
      })

      Enum.each(people, fn p ->
        refute Notifications.is_subscriber?(p.id, ctx.subscriptions_list.id)
      end)
    end

    test "adds and removes subscriptions", ctx do
      another = person_fixture(%{company_id: ctx.company.id})
      subscribe_people(ctx, [ctx.person])

      assert Notifications.is_subscriber?(ctx.person.id, ctx.subscriptions_list.id)
      refute Notifications.is_subscriber?(another.id, ctx.subscriptions_list.id)

      assert {200, _} = mutation(ctx.conn, :edit_subscriptions_list, %{
        id: Paths.subscription_list_id(ctx.subscriptions_list),
        type: "project_check_in",
        send_notifications_to_everyone: true,
        subscriber_ids: [Paths.person_id(another)],
      })

      refute Notifications.is_subscriber?(ctx.person.id, ctx.subscriptions_list.id)
      assert Notifications.is_subscriber?(another.id, ctx.subscriptions_list.id)
    end

    test "doesn't remove subscriptions", ctx do
      another = person_fixture(%{company_id: ctx.company.id})
      subscribe_people(ctx, [ctx.person, another])

      assert Notifications.is_subscriber?(ctx.person.id, ctx.subscriptions_list.id)
      assert Notifications.is_subscriber?(another.id, ctx.subscriptions_list.id)

      assert {200, _} = mutation(ctx.conn, :edit_subscriptions_list, %{
        id: Paths.subscription_list_id(ctx.subscriptions_list),
        type: "project_check_in",
        send_notifications_to_everyone: true,
        subscriber_ids: [Paths.person_id(another)],
      })

      refute Notifications.is_subscriber?(ctx.person.id, ctx.subscriptions_list.id)
      assert Notifications.is_subscriber?(another.id, ctx.subscriptions_list.id)
    end
  end

  #
  # Helpers
  #

  defp create_people(ctx) do
    Enum.map(1..3, fn _ ->
      person_fixture(%{company_id: ctx.company.id})
    end)
  end

  defp subscribe_people(ctx, people) do
    Enum.each(people, fn p ->
      Notifications.create_subscription(%{
        subscription_list_id: ctx.subscriptions_list.id,
        person_id: p.id,
        type: :invited,
      })
    end)
  end

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
