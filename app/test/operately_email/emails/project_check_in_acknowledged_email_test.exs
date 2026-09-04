defmodule OperatelyEmail.Emails.ProjectCheckInAcknowledgedEmailTest do
  use Operately.DataCase

  import Operately.ActivitiesFixtures

  alias OperatelyEmail.Emails.ProjectCheckInAcknowledgedEmail
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_check_in(:check_in, :project, :creator)
    |> then(&{:ok, &1})
  end

  test "buffered item links the update to the acknowledged check-in", ctx do
    activity =
      activity_fixture(%{
        action: "project_check_in_acknowledged",
        author_id: ctx.creator.id,
        content: %{"project_id" => ctx.project.id, "check_in_id" => ctx.check_in.id}
      })

    item = ProjectCheckInAcknowledgedEmail.buffered_item(ctx.creator, activity)

    assert item.item_url == Paths.project_check_in_path(ctx.company, ctx.check_in) |> Paths.to_url()
  end
end
