defmodule OperatelyWeb.Mcp.Tools.Notifications.MarkAllNotificationsReadTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Notifications.MarkAllNotificationsRead, as: Tool

  test "handles only the connected member notifications" do
    ctx = Factory.setup(%{}) |> Factory.add_company_member(:member)
    activity = Operately.ActivitiesFixtures.activity_fixture(author_id: ctx.creator.id)
    notification = Operately.NotificationsFixtures.notification_fixture(person_id: ctx.creator.id, activity_id: activity.id, read: false)
    other = Operately.NotificationsFixtures.notification_fixture(person_id: ctx.member.id, activity_id: activity.id, read: false)
    assert {:ok, _} = Tool.call(ToolConnHelper.conn(ctx), %{})
    assert Repo.reload!(notification).read
    refute Repo.reload!(other).read
  end
end
