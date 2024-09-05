defmodule OperatelyWeb.Api.Mutations.UnsubscribeFromNotificationsTest do
  use OperatelyWeb.TurboCase

  import Operately.ProjectsFixtures

  alias Operately.Notifications

  describe "security" do
    test "it requires authentication", ctx do
      assert {401, _} = mutation(ctx.conn, :unsubscribe_from_notifications, %{})
    end
  end

  describe "unsubscribe_from_notifications functionality" do
    setup ctx do
      ctx = register_and_log_in_account(ctx)

      project = project_fixture(%{company_id: ctx.company.id, creator_id: ctx.person.id, group_id: ctx.company.company_space_id})
      check_in = check_in_fixture(%{author_id: ctx.person.id, project_id: project.id})
      subscription_list = Notifications.get_subscription_list!(parent_id: check_in.id)

      Map.merge(ctx, %{subscription_list: subscription_list})
    end

    test "unsubscribes to notifications list", ctx do
      {:ok, _} = Notifications.create_subscription(%{
        person_id: ctx.person.id,
        subscription_list_id: ctx.subscription_list.id,
        type: :invited,
      })

      assert Notifications.is_subscriber?(ctx.person.id, ctx.subscription_list.id)

      assert {200, _} = mutation(ctx.conn, :unsubscribe_from_notifications, %{
        id: Paths.subscription_list_id(ctx.subscription_list),
      })

      refute Notifications.is_subscriber?(ctx.person.id, ctx.subscription_list.id)
    end
  end
end
