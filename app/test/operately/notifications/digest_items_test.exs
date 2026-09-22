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

  test "skips items when a related record has been deleted", ctx do
    activity = activity_fixture(author_id: ctx.creator.id, action: "task_adding", content: %{"task_id" => ctx.task.id})
    notification = notification_fixture(activity_id: activity.id, person_id: ctx.creator.id) |> Repo.preload(:activity)

    Operately.Repo.delete!(ctx.task)

    assert {[], []} = DigestItems.build([notification], ctx.creator)
  end
end
