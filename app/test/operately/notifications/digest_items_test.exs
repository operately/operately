defmodule Operately.Notifications.DigestItemsTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures
  import Operately.NotificationsFixtures

  alias Operately.Notifications.DigestItems
  alias Operately.Support.Factory

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_project_milestone(:milestone, :project)
      |> Factory.add_project_task(:task, :milestone)

    {:ok, ctx}
  end

  test "skips items when a related task has been deleted", ctx do
    comment_id = Ecto.UUID.generate()

    notifications =
      [
        {"task_assignee_updating", %{"task_id" => ctx.task.id, "old_assignee_id" => nil, "new_assignee_id" => ctx.creator.id}},
        {"task_adding", %{"task_id" => ctx.task.id}},
        {"task_moving", %{"task_id" => ctx.task.id}},
        {"task_due_date_updating", %{"task_id" => ctx.task.id}},
        {"task_description_change", %{"task_id" => ctx.task.id}},
        {"project_task_commented", %{"task_id" => ctx.task.id, "comment_id" => comment_id}},
        {"space_task_commented", %{"task_id" => ctx.task.id, "comment_id" => comment_id}}
      ]
      |> Enum.map(fn {action, content} ->
        activity = activity_fixture(author_id: ctx.creator.id, action: action, content: content)
        notification_fixture(activity_id: activity.id, person_id: ctx.creator.id) |> Repo.preload(:activity)
      end)

    Operately.Repo.delete!(ctx.task)

    assert {[], []} = DigestItems.build(notifications, ctx.creator)
  end

  test "keeps remaining digest items when a deleted-task notification is mixed in", ctx do
    adding_activity = activity_fixture(author_id: ctx.creator.id, action: "task_adding", content: %{"task_id" => ctx.task.id})
    adding = notification_fixture(activity_id: adding_activity.id, person_id: ctx.creator.id) |> Repo.preload(:activity)

    created_activity = activity_fixture(author_id: ctx.creator.id, action: "project_created", content: %{"project_id" => ctx.project.id})
    created = notification_fixture(activity_id: created_activity.id, person_id: ctx.creator.id) |> Repo.preload(:activity)

    Operately.Repo.delete!(ctx.task)

    {items, included} = DigestItems.build([adding, created], ctx.creator)

    assert length(items) == 1
    assert [kept] = included
    assert kept.id == created.id
  end
end
