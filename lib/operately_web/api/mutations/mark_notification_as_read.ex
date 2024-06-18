defmodule OperatelyWeb.Api.Mutations.MarkNotificationAsRead do
  use TurboConnect.Mutation

  inputs do
    field :id, :string
  end

  def call(conn, inputs) do
    me = conn.assigns.current_account.person
    id = inputs.id

    notification = Operately.Notifications.get_notification!(id)

    if notification.person_id == me.id do
      Operately.Notifications.mark_as_read(notification)
      {:ok, %{}}
    else
      {:error, :not_found}
    end
  end
end
