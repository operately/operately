defmodule OperatelyWeb.Api.Mutations.MarkNotificationsAsRead do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :ids, list_of(:string)
  end

  def call(conn, inputs) do
    notifications = Operately.Notifications.list_notifications(inputs.ids)
    person = me(conn)

    if allowed?(notifications, person) do
      Operately.Notifications.mark_as_read(notifications, person)
      {:ok, %{}}
    else
      {:error, :not_found}
    end
  end

  defp allowed?(notifications, person) do
    Enum.all?(notifications, &(&1.person_id == person.id))
  end
end
