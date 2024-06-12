defmodule OperatelyWeb.Api.Queries.GetUnreadNotificationCount do
  use TurboConnect.Query

  outputs do
    field :unread, :integer
  end

  def call(conn, _inputs) do
    me = conn.assigns.current_account.person
    count = Operately.Notifications.unread_notifications_count(me)

    {:ok, %{unread: count}}
  end
end
