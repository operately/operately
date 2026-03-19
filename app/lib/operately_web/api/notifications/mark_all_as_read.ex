defmodule OperatelyWeb.Api.Notifications.MarkAllAsRead do
  @moduledoc """
  Marks all notifications as read for the current user.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  def call(conn, _inputs) do
    Operately.Notifications.mark_all_as_read(me(conn))
    {:ok, %{}}
  end
end
