defmodule Operately.Notifications.BufferedEmailWorkerTest do
  use Operately.DataCase

  import Mock

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures

  alias Operately.Notifications
  alias Operately.Notifications.BufferedEmailWorker

  setup ctx do
    ctx = Factory.setup(ctx)
    ctx = Factory.add_space(ctx, :space)

    {:ok, batch} =
      Notifications.create_email_batch(%{
        person_id: ctx.creator.id,
        status: :scheduled,
        window_minutes: 5,
        window_started_at: ~N[2026-04-02 10:00:00],
        send_at: ~N[2026-04-02 10:05:00]
      })

    Map.put(ctx, :batch, batch)
  end

  test "single-item batch uses existing email template", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    activity = activity_fixture(author_id: ctx.creator.id, action: "project_created", content: %{"project_id" => ctx.project.id})

    notification =
      notification_fixture(
        activity_id: activity.id,
        person_id: ctx.creator.id,
        email_batch_id: ctx.batch.id,
        email_sent: false,
        email_sent_at: nil
      )

    with_mocks([
      {OperatelyEmail.Emails.ProjectCreatedEmail, [:passthrough], [send: fn _person, _activity -> {:ok, :delivered} end]}
    ]) do
      assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})

      assert_called(OperatelyEmail.Emails.ProjectCreatedEmail.send(:_, :_))
    end

    batch = Notifications.get_email_batch!(ctx.batch.id)
    updated_notification = Notifications.get_notification!(notification.id)

    assert batch.status == :sent
    refute is_nil(batch.sent_at)
    assert updated_notification.email_sent
    refute is_nil(updated_notification.email_sent_at)
  end

  test "multi-item batch renders digest email", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    activity_one = activity_fixture(author_id: ctx.creator.id, action: "project_created", content: %{"project_id" => ctx.project.id})
    activity_two = activity_fixture(author_id: ctx.creator.id, action: "project_created", content: %{"project_id" => ctx.project.id})

    notification_one =
      notification_fixture(
        activity_id: activity_one.id,
        person_id: ctx.creator.id,
        email_batch_id: ctx.batch.id,
        email_sent: false,
        email_sent_at: nil
      )

    notification_two =
      notification_fixture(
        activity_id: activity_two.id,
        person_id: ctx.creator.id,
        email_batch_id: ctx.batch.id,
        email_sent: false,
        email_sent_at: nil
      )

    with_mocks([
      {OperatelyEmail.Mailers.DigestMailer, [:passthrough], [send: fn _person, _batch, _items -> {:ok, :delivered} end]}
    ]) do
      assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})

      assert_called(OperatelyEmail.Mailers.DigestMailer.send(:_, :_, :_))
    end

    batch = Notifications.get_email_batch!(ctx.batch.id)
    notifications = Notifications.list_notifications([notification_one.id, notification_two.id])

    assert batch.status == :sent
    refute is_nil(batch.sent_at)
    assert Enum.all?(notifications, & &1.email_sent)
    assert Enum.all?(notifications, &(not is_nil(&1.email_sent_at)))
  end

  test "digest groups activities by parent resource", ctx do
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_goal(ctx, :goal, :space)

    activity_one = activity_fixture(author_id: ctx.creator.id, action: "project_created", content: %{"project_id" => ctx.project.id})
    activity_two = activity_fixture(author_id: ctx.creator.id, action: "goal_created", content: %{"goal_id" => ctx.goal.id})

    notification_fixture(
      activity_id: activity_one.id,
      person_id: ctx.creator.id,
      email_batch_id: ctx.batch.id,
      email_sent: false,
      email_sent_at: nil
    )

    notification_fixture(
      activity_id: activity_two.id,
      person_id: ctx.creator.id,
      email_batch_id: ctx.batch.id,
      email_sent: false,
      email_sent_at: nil
    )

    with_mocks([
      {OperatelyEmail.Mailers.DigestMailer, [:passthrough], [send: fn _person, _batch, items ->
        assert length(items) == 2
        assert Enum.any?(items, fn item -> item.parent_type == :project end)
        assert Enum.any?(items, fn item -> item.parent_type == :goal end)
        {:ok, :delivered}
      end]}
    ]) do
      assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})
    end
  end

  test "digest renders mixed project, goal, and space items while task and milestone items roll up to parent resources", ctx do
    ctx = Factory.add_goal(ctx, :goal, :space)
    ctx = Factory.add_project(ctx, :project, :space)
    ctx = Factory.add_project_milestone(ctx, :milestone, :project)
    ctx = Factory.add_project_task(ctx, :task, :milestone)
    ctx = Factory.create_space_task(ctx, :space_task, :space)

    activity_project = activity_fixture(author_id: ctx.creator.id, action: "project_created", content: %{"project_id" => ctx.project.id})
    activity_goal = activity_fixture(author_id: ctx.creator.id, action: "goal_created", content: %{"goal_id" => ctx.goal.id})
    activity_project_task = activity_fixture(author_id: ctx.creator.id, action: "task_adding", content: %{"task_id" => ctx.task.id})
    activity_space_task = activity_fixture(author_id: ctx.creator.id, action: "task_adding", content: %{"task_id" => ctx.space_task.id})
    activity_milestone = activity_fixture(author_id: ctx.creator.id, action: "milestone_due_date_updating", content: %{"milestone_id" => ctx.milestone.id})

    notification_fixture(activity_id: activity_project.id, person_id: ctx.creator.id, email_batch_id: ctx.batch.id, email_sent: false, email_sent_at: nil)
    notification_fixture(activity_id: activity_goal.id, person_id: ctx.creator.id, email_batch_id: ctx.batch.id, email_sent: false, email_sent_at: nil)
    notification_fixture(activity_id: activity_project_task.id, person_id: ctx.creator.id, email_batch_id: ctx.batch.id, email_sent: false, email_sent_at: nil)
    notification_fixture(activity_id: activity_space_task.id, person_id: ctx.creator.id, email_batch_id: ctx.batch.id, email_sent: false, email_sent_at: nil)
    notification_fixture(activity_id: activity_milestone.id, person_id: ctx.creator.id, email_batch_id: ctx.batch.id, email_sent: false, email_sent_at: nil)

    with_mocks([
      {OperatelyEmail.Mailers.DigestMailer, [:passthrough], [send: fn _person, _batch, items ->
        project_items = Enum.filter(items, &(&1.parent_type == :project))

        assert Enum.any?(items, &(&1.parent_type == :project))
        assert Enum.any?(items, &(&1.parent_type == :goal))
        assert Enum.any?(items, &(&1.parent_type == :space))
        refute Enum.any?(items, &(&1.parent_type == :task))
        refute Enum.any?(items, &(&1.parent_type == :milestone))
        assert length(project_items) >= 3
        {:ok, :delivered}
      end]}
    ]) do
      assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})
    end
  end

  test "skips notifications without buffered_item/2 and logs warning", ctx do
    activity = activity_fixture(author_id: ctx.creator.id, action: "resource_hub_link_created")

    notification_fixture(
      activity_id: activity.id,
      person_id: ctx.creator.id,
      email_batch_id: ctx.batch.id,
      email_sent: false,
      email_sent_at: nil
    )

    notification_fixture(
      activity_id: activity.id,
      person_id: ctx.creator.id,
      email_batch_id: ctx.batch.id,
      email_sent: false,
      email_sent_at: nil
    )

    assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})

    batch = Notifications.get_email_batch!(ctx.batch.id)
    assert batch.status == :skipped
  end

  test "marks an empty batch as skipped", ctx do
    assert :ok = BufferedEmailWorker.perform(%{args: %{"email_batch_id" => ctx.batch.id}})

    batch = Notifications.get_email_batch!(ctx.batch.id)

    assert batch.status == :skipped
    assert is_nil(batch.sent_at)
  end
end
