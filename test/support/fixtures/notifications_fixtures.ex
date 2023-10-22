defmodule Operately.NotificationsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Notifications` context.
  """

  @doc """
  Generate a notification.
  """
  def notification_fixture(attrs \\ %{}) do
    {:ok, notification} =
      attrs
      |> Enum.into(%{
        email_sent: true,
        email_sent_at: ~N[2023-10-17 13:34:00],
        read: true,
        read_at: ~N[2023-10-17 13:34:00],
        should_send_email: true
      })
      |> Operately.Notifications.create_notification()

    notification
  end
end
