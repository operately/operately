defmodule Operately.NotificationsTest do
  use Operately.DataCase

  import Ecto.Query, only: [from: 2]

  alias Operately.Notifications

  describe "notifications" do
    import Operately.NotificationsFixtures
    import Operately.CompaniesFixtures
    import Operately.PeopleFixtures
    import Operately.ActivitiesFixtures

    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      activity = activity_fixture(%{author_id: person.id})
      notification = notification_fixture(activity_id: activity.id, person_id: person.id)

      {:ok, company: company, person: person, activity: activity, notification: notification}
    end

    test "list_notifications/0 returns all notifications", ctx do
      assert Notifications.list_notifications() == [ctx.notification]
    end

    test "get_notification!/1 returns the notification with given id", ctx do
      assert Notifications.get_notification!(ctx.notification.id) == ctx.notification
    end
  end

  describe "subscriptions" do
    import Operately.NotificationsFixtures
    import Operately.CompaniesFixtures
    import Operately.PeopleFixtures

    setup do
      company = company_fixture()
      person = person_fixture(company_id: company.id)
      list = subscriptions_list_fixture()

      {:ok, person: person, list: list}
    end

    test "create_subscription/1 blocks repeated subscriptions for the same person and list", ctx do
      assert {:ok, _subscription} =
               Notifications.create_subscription(%{
                 subscription_list_id: ctx.list.id,
                 person_id: ctx.person.id,
                 type: :joined
               })

      assert {:error, _changeset} =
               Notifications.create_subscription(%{
                 subscription_list_id: ctx.list.id,
                 person_id: ctx.person.id,
                 type: :invited
               })

      assert subscription_count(ctx.list.id, ctx.person.id) == 1
    end
  end

  defp subscription_count(subscription_list_id, person_id) do
    Repo.one(
      from(s in Operately.Notifications.Subscription,
        where: s.subscription_list_id == ^subscription_list_id,
        where: s.person_id == ^person_id,
        select: count(s.id)
      )
    )
  end
end
