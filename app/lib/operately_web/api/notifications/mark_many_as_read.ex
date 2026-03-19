defmodule OperatelyWeb.Api.Notifications.MarkManyAsRead do
  @moduledoc """
  Marks multiple notifications as read for the current user.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  inputs do
    field :ids, list_of(:id), null: false
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
