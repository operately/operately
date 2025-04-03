defmodule OperatelyWeb.Api.Mutations.MarkNotificationAsRead do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :id, :string
  end

  def call(conn, inputs) do
    id = inputs.id

    notification = Operately.Notifications.get_notification!(id)

    if notification.person_id == me(conn).id do
      Operately.Notifications.mark_as_read(notification)
      {:ok, %{}}
    else
      {:error, :not_found}
    end
  end
end
