defmodule OperatelyWeb.Api.Queries.GetUnreadNotificationCount do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  outputs do
    field? :unread, :integer, null: true
  end

  def call(conn, _inputs) do
    count = Operately.Notifications.unread_notifications_count(me(conn))

    {:ok, %{unread: count}}
  end
end
