defmodule Operately.MessagesFixtures do
  def message_fixture(author_id, space_id, attrs \\ []) do
    {:ok, message} =
      attrs
      |> Enum.into(%{
        author_id: author_id,
        space_id: space_id,
        title: "Some message",
        body: Operately.Support.RichText.rich_text("Some content"),
      })
      |> Operately.Messages.create_message()

    message
  end
end
