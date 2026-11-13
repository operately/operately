defmodule OperatelyWeb.Mcp.Tools.Notifications.ListNotificationsTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Notifications.ListNotifications, as: Tool

  test "handles only the connected member notifications" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    activity = Repo.get_by!(Operately.Activities.Activity, action: "project_created")
    notification = Operately.NotificationsFixtures.notification_fixture(person_id: ctx.creator.id, activity_id: activity.id, read: false)
    assert {:ok, result} = Tool.call(ToolConnHelper.conn(ctx), %{})
    assert Enum.any?(result.notifications, &(&1.id == notification.id and &1.read == false))
  end
end
