defmodule OperatelyEmail.Cron.DailySummaryTest do
  use Operately.DataCase
  use Oban.Testing, repo: Operately.Repo

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

  describe "people_with_daily_summary_schedule/1" do
    test "returns schedule offsets based on delivery time and timezone", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:new_york_due, timezone: "America/New_York", preferences: %{notifications: %{daily_summary_delivery_time: "14:00"}})
        |> Factory.add_company_member(:new_york_not_due, timezone: "America/New_York", preferences: %{notifications: %{daily_summary_delivery_time: "15:00"}})
        |> Factory.add_company_member(:invalid_timezone_due, timezone: "America/New_Jersey", preferences: %{notifications: %{daily_summary_delivery_time: "18:00"}})
        |> Factory.add_company_member(:disabled_member, preferences: %{notifications: %{send_daily_summary: false, daily_summary_delivery_time: "18:00"}})

      {:ok, no_account_member} =
        Operately.People.create_person(%{
          company_id: ctx.company.id,
          full_name: "No Account Member",
          preferences: %{notifications: %{send_daily_summary: true, daily_summary_delivery_time: "18:00"}}
        })

      schedules = DailySummary.people_with_daily_summary_schedule(~U[2026-04-08 18:00:00Z])
      schedule_by_person = Map.new(schedules, fn row -> {row.person_id, row.schedule_in_seconds} end)

      assert schedule_by_person[ctx.creator.id] == 0
      assert schedule_by_person[ctx.new_york_due.id] == 0
      assert schedule_by_person[ctx.new_york_not_due.id] == 3600
      assert schedule_by_person[ctx.invalid_timezone_due.id] == 0

      refute Map.has_key?(schedule_by_person, ctx.disabled_member.id)
      refute Map.has_key?(schedule_by_person, no_account_member.id)
    end

    test "uses default delivery time when preference is missing", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:default_time_member, timezone: "Etc/UTC", preferences: %{notifications: %{send_daily_summary: true}})

      schedules = DailySummary.people_with_daily_summary_schedule(~U[2026-04-08 17:30:00Z])
      schedule_by_person = Map.new(schedules, fn row -> {row.person_id, row.schedule_in_seconds} end)

      assert schedule_by_person[ctx.default_time_member.id] == 1800
    end

    test "rolls over to the next local day when delivery time already passed", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:past_due_member, timezone: "Etc/UTC", preferences: %{notifications: %{daily_summary_delivery_time: "17:00"}})

      schedules = DailySummary.people_with_daily_summary_schedule(~U[2026-04-08 18:00:00Z])
      schedule_by_person = Map.new(schedules, fn row -> {row.person_id, row.schedule_in_seconds} end)

      assert schedule_by_person[ctx.past_due_member.id] == 82_800
    end

    test "falls back to UTC when timezone is invalid or missing", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:invalid_timezone_member, timezone: "America/New_Jersey", preferences: %{notifications: %{daily_summary_delivery_time: "19:00"}})
        |> Factory.add_company_member(:nil_timezone_member, timezone: nil, preferences: %{notifications: %{daily_summary_delivery_time: "19:00"}})

      schedules = DailySummary.people_with_daily_summary_schedule(~U[2026-04-08 18:00:00Z])
      schedule_by_person = Map.new(schedules, fn row -> {row.person_id, row.schedule_in_seconds} end)

      assert schedule_by_person[ctx.invalid_timezone_member.id] == 3600
      assert schedule_by_person[ctx.nil_timezone_member.id] == 3600
    end

    test "keeps second-level precision when computing offsets", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:precision_member, timezone: "Etc/UTC", preferences: %{notifications: %{daily_summary_delivery_time: "19:00"}})

      schedules = DailySummary.people_with_daily_summary_schedule(~U[2026-04-08 18:23:10Z])
      schedule_by_person = Map.new(schedules, fn row -> {row.person_id, row.schedule_in_seconds} end)

      assert schedule_by_person[ctx.precision_member.id] == 2210
    end
  end

  describe "send_daily_summaries/1" do
    test "enqueues summary delivery jobs for each eligible person with the right schedule", ctx do
      ctx =
        ctx
        |> Factory.add_company_member(:new_york_due, timezone: "America/New_York", preferences: %{notifications: %{daily_summary_delivery_time: "14:00"}})
        |> Factory.add_company_member(:new_york_not_due, timezone: "America/New_York", preferences: %{notifications: %{daily_summary_delivery_time: "15:00"}})
        |> Factory.add_company_member(:disabled_member, preferences: %{notifications: %{send_daily_summary: false}})

      now = ~U[2026-04-08 18:00:00Z]

      Oban.Testing.with_testing_mode(:manual, fn ->
        assert :ok = DailySummary.send_daily_summaries(now)

        assert_enqueued worker: DailySummary, args: %{person_id: ctx.creator.id}
        assert_enqueued worker: DailySummary, args: %{person_id: ctx.new_york_due.id}
        assert_enqueued worker: DailySummary, args: %{person_id: ctx.new_york_not_due.id}
        refute_enqueued worker: DailySummary, args: %{person_id: ctx.disabled_member.id}

        jobs = all_enqueued(worker: DailySummary)
        creator_job = Enum.find(jobs, &(&1.args["person_id"] == ctx.creator.id))
        ny_due_job = Enum.find(jobs, &(&1.args["person_id"] == ctx.new_york_due.id))
        ny_not_due_job = Enum.find(jobs, &(&1.args["person_id"] == ctx.new_york_not_due.id))

        assert creator_job
        assert ny_due_job
        assert ny_not_due_job

        due_gap = seconds_diff(creator_job.scheduled_at, ny_due_job.scheduled_at) |> abs()
        delayed_gap = seconds_diff(ny_not_due_job.scheduled_at, ny_due_job.scheduled_at)

        assert due_gap <= 2
        assert delayed_gap in 3598..3602
      end)
    end
  end

  describe "deliver_daily_summary/2" do
    test "skips when there are no updates in the last 24 hours", ctx do
      with_mocks([
        {OperatelyEmail.Mailers.DigestMailer, [:passthrough], [send_daily_summary: fn _person, _items -> {:ok, :delivered} end]}
      ]) do
        assert :ok = DailySummary.deliver_daily_summary(ctx.creator.id, ~U[2026-04-08 18:00:00Z])
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
        assert :ok = DailySummary.deliver_daily_summary(person.id, ~U[2026-04-08 18:00:00Z])
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
        assert :ok = DailySummary.deliver_daily_summary(person.id, ~U[2026-04-08 18:00:00Z])
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

  defp seconds_diff(%DateTime{} = left, %DateTime{} = right), do: DateTime.diff(left, right, :second)
  defp seconds_diff(%NaiveDateTime{} = left, %NaiveDateTime{} = right), do: NaiveDateTime.diff(left, right, :second)
  defp seconds_diff(%DateTime{} = left, %NaiveDateTime{} = right), do: seconds_diff(DateTime.to_naive(left), right)
  defp seconds_diff(%NaiveDateTime{} = left, %DateTime{} = right), do: seconds_diff(left, DateTime.to_naive(right))
end
