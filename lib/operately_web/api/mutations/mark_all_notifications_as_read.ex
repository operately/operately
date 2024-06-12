defmodule OperatelyWeb.Api.Mutations.MarkAllNotificationsAsRead do
  use TurboConnect.Mutation

  def call(conn, _inputs) do
    me = conn.assigns.current_account.person
    Operately.Notifications.mark_all_as_read(me)
    {:ok, %{}}
  end
end
