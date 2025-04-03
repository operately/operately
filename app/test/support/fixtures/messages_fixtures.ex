defmodule Operately.MessagesFixtures do
  def messages_board_fixture(space_id, attrs \\ []) do
    {:ok, board} =
      attrs
      |> Enum.into(%{
        space_id: space_id,
        name: "Messages Board",
        description: Operately.Support.RichText.rich_text("Some description"),
      })
      |> Operately.Messages.create_messages_board()

    board
  end

  def message_fixture(author_id, messages_board_id, attrs \\ []) do
    subscription_list = Operately.NotificationsFixtures.subscriptions_list_fixture(attrs)

    {:ok, message} =
      attrs
      |> Enum.into(%{
        author_id: author_id,
        messages_board_id: messages_board_id,
        title: "Some message",
        body: Operately.Support.RichText.rich_text("Some content"),
        subscription_list_id: subscription_list.id,
        state: :published,
      })
      |> Operately.Messages.create_message()

    {:ok, _} = Operately.Notifications.update_subscription_list(subscription_list, %{
      parent_type: :message,
      parent_id: message.id,
    })

    message
  end
end
