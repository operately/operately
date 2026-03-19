defmodule OperatelyWeb.Api.Notifications.MarkAsRead do
  @moduledoc """
  Marks a notification as read for the current user.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :id, null: false
  end

  def call(conn, inputs) do
    notification = Operately.Notifications.get_notification!(inputs.id)

    if notification.person_id == me(conn).id do
      Operately.Notifications.mark_as_read(notification)
      {:ok, %{}}
    else
      {:error, :not_found}
    end
  end
end
