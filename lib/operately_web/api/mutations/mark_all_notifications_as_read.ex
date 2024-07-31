defmodule OperatelyWeb.Api.Mutations.MarkAllNotificationsAsRead do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  def call(conn, _inputs) do
    Operately.Notifications.mark_all_as_read(me(conn))
    {:ok, %{}}
  end
end
