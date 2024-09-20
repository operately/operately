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

  def subscriptions_list_fixture(attrs \\ []) do
    {:ok, subscriptions_list} = Operately.Notifications.create_subscription_list(%{
      send_to_everyone: Keyword.get(attrs, :send_to_everyone, false),
    })

    Keyword.get(attrs, :person_ids, [])
    |> Enum.each(fn id ->
      subscription_fixture(subscription_list_id: subscriptions_list.id, person_id: id)
    end)

    subscriptions_list
  end

  def subscription_fixture(attrs \\ []) do
    {:ok, subscription} =
      attrs
      |> Enum.into(%{
        type: :invited,
      })
      |> Operately.Notifications.create_subscription()

    subscription
  end
end
