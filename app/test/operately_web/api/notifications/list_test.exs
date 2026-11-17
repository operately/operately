defmodule OperatelyWeb.Api.Notifications.ListTest do
  use OperatelyWeb.TurboCase

  test "notification activities include loaded task assignee arrays", ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.log_in_person(:creator)
      |> Factory.add_company_member(:assignee)
      |> Factory.add_space(:space)
      |> Factory.preload(:space, :access_context)
      |> Factory.create_space_task(:task, :space)

    activity =
      Repo.insert!(%Operately.Activities.Activity{
        action: "task_assignee_updating",
        author_id: ctx.creator.id,
        access_context_id: ctx.space.access_context.id,
        content: %{
          company_id: ctx.company.id,
          space_id: ctx.space.id,
          task_id: ctx.task.id,
          added_assignee_ids: [ctx.assignee.id],
          removed_assignee_ids: [ctx.creator.id]
        }
      })

    Repo.insert!(%Operately.Notifications.Notification{activity_id: activity.id, person_id: ctx.creator.id})

    assert {200, res} = query(ctx.conn, [:notifications, :list], %{})
    assert [%{activity: %{content: content}}] = res.notifications
    assert content.added_assignees == [Serializer.serialize(ctx.assignee)]
    assert content.removed_assignees == [Serializer.serialize(ctx.creator)]
  end
end
