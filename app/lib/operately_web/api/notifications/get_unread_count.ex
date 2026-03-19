defmodule OperatelyWeb.Api.Notifications.GetUnreadCount do
  @moduledoc """
  Returns the count of unread notifications for the current user.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  outputs do
    field :unread, :integer, null: false
  end

  def call(conn, _inputs) do
    count = Operately.Notifications.unread_notifications_count(me(conn))

    {:ok, %{unread: count}}
  end
end
