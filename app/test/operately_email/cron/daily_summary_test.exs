defmodule OperatelyEmail.Cron.DailySummaryTest do
  use Operately.DataCase

  import Mock

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures

  alias Operately.Notifications.Notification
  alias OperatelyEmail.Cron.DailySummary

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.enable_feature("buffered_notifications")
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)

    {:ok, ctx}
  end

  describe "people_who_want_daily_summary_emails/0" do
    test "returns only people with account emails and daily summary preference enabled", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:enabled_member)
        |> Factory.add_company_member(:disabled_member, preferences: %{notifications: %{send_daily_summary: false}})

      {:ok, no_account_member} =
        Operately.People.create_person(%{
          company_id: ctx.company.id,
          full_name: "No Account Member",
          preferences: %{notifications: %{send_daily_summary: true}}
        })

      people = DailySummary.people_who_want_daily_summary_emails()

      assert MapSet.new(Enum.map(people, & &1.id)) == MapSet.new([ctx.creator.id, ctx.enabled_member.id])
      refute Enum.any?(people, &(&1.id == ctx.disabled_member.id))
      refute Enum.any?(people, &(&1.id == no_account_member.id))
      assert Enum.all?(people, &Ecto.assoc_loaded?(&1.account))
      assert Enum.all?(people, &Ecto.assoc_loaded?(&1.company))
    end
  end

  describe "send_daily_summaries/1" do
    test "skips when there are no updates in the last 24 hours", _ctx do
      with_mocks([
        {OperatelyEmail.Mailers.DigestMailer, [:passthrough], [send_daily_summary: fn _person, _items -> {:ok, :delivered} end]}
      ]) do
        assert :ok = DailySummary.send_daily_summaries(~U[2026-04-08 18:00:00Z])

        assert_not_called(OperatelyEmail.Mailers.DigestMailer.send_daily_summary(:_, :_))
      end
    end

    test "sends only updates from the last 24 hours", ctx do
      person = ctx.creator

      recent_activity = activity_fixture(author_id: person.id, action: "project_created", content: %{"project_id" => ctx.project.id})
      old_activity = activity_fixture(author_id: person.id, action: "goal_created", content: %{"goal_id" => ctx.goal.id})

      _recent_notification = notification_at(person.id, recent_activity.id, ~N[2026-04-08 17:00:00])
      _old_notification = notification_at(person.id, old_activity.id, ~N[2026-04-07 16:00:00])

      with_mocks([
        {OperatelyEmail.Mailers.DigestMailer, [:passthrough], [send_daily_summary: fn _person, items ->
          assert length(items) == 1
          assert hd(items).parent_type == :project
          {:ok, :delivered}
        end]}
      ]) do
        assert :ok = DailySummary.send_daily_summaries(~U[2026-04-08 18:00:00Z])
      end
    end

    test "sends grouped summary payload using non-bypassed updates from the last 24 hours", ctx do
      person = ctx.creator

      project_activity = activity_fixture(author_id: person.id, action: "project_created", content: %{"project_id" => ctx.project.id})
      goal_activity = activity_fixture(author_id: person.id, action: "goal_created", content: %{"goal_id" => ctx.goal.id})
      space_activity = activity_fixture(author_id: person.id, action: "space_joining", content: %{"space_id" => ctx.space.id})
      bypass_activity = activity_fixture(author_id: person.id, action: "guest_invited", content: %{"guest_email" => "guest@example.com"})

      _notification1 = notification_at(person.id, project_activity.id, ~N[2026-04-08 09:00:00])
      _notification2 = notification_at(person.id, goal_activity.id, ~N[2026-04-08 10:00:00])
      _notification3 = notification_at(person.id, space_activity.id, ~N[2026-04-08 11:00:00])
      _notification4 = notification_at(person.id, bypass_activity.id, ~N[2026-04-08 12:00:00])

      with_mocks([
        {OperatelyEmail.Mailers.DigestMailer, [:passthrough], [send_daily_summary: fn _person, items ->
          assert length(items) == 3
          assert Enum.any?(items, &(&1.parent_type == :project))
          assert Enum.any?(items, &(&1.parent_type == :goal))
          assert Enum.any?(items, &(&1.parent_type == :space))
          refute Enum.any?(items, &String.contains?(&1.headline, "invited"))
          {:ok, :delivered}
        end]}
      ]) do
        assert :ok = DailySummary.send_daily_summaries(~U[2026-04-08 18:00:00Z])
      end
    end
  end

  defp notification_at(person_id, activity_id, inserted_at) do
    notification =
      notification_fixture(
        person_id: person_id,
        activity_id: activity_id,
        should_send_email: true
      )

    from(n in Notification, where: n.id == ^notification.id)
    |> Repo.update_all(set: [inserted_at: inserted_at, updated_at: inserted_at])

    Repo.get!(Notification, notification.id)
  end
end
