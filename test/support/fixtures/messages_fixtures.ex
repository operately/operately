defmodule Operately.MessagesFixtures do
  def message_fixture(author_id, space_id, attrs \\ []) do
    {:ok, subscription_list} = Operately.Notifications.create_subscription_list()
    {:ok, message} =
      attrs
      |> Enum.into(%{
        author_id: author_id,
        space_id: space_id,
        title: "Some message",
        body: Operately.Support.RichText.rich_text("Some content"),
        subscription_list_id: subscription_list.id,
      })
      |> Operately.Messages.create_message()

    {:ok, _} = Operately.Notifications.update_subscription_list(subscription_list, %{
      parent_type: :message,
      parent_id: message.id,
    })

    message
  end
end
