defmodule Operately.Demo.Discussions do
  alias Operately.Demo.{Comments, Resources}
  alias Operately.Operations.DiscussionPosting
  alias Operately.Demo.PoorMansMarkdown

  # no discussions to create
  def create_discussions(resources, nil), do: resources

  def create_discussions(resources, data) do
    Resources.create(resources, data, fn {resources, data, index} ->
      create_discussion(resources, data, index)
    end)
  end

  defp create_discussion(resources, data, index) do
    author = Resources.get(resources, data.author)
    space = Resources.get(resources, data.space)
    board = Operately.Messages.get_messages_board(space_id: space.id)

    {:ok, discussion} = DiscussionPosting.run(author, space, %{
      messages_board_id: board.id,
      title: data.title,
      content: PoorMansMarkdown.from_markdown(data.content, resources),
      post_as_draft: false,
      send_to_everyone: true,
      subscription_parent_type: :message,
      subscriber_ids: []
    })

    update_inserted_at(discussion, index)
    Comments.create_comments(resources, discussion, data[:comments])

    discussion
  end

  # if every discussion is inserted at the same time, they will have the same inserted_at value
  # and the sorting will not have a well defined order

  defp update_inserted_at(discussion, index) do
    discussion
    |> Operately.Messages.Message.changeset(%{inserted_at: NaiveDateTime.add(discussion.inserted_at, index, :second)})
    |> Operately.Repo.update()
  end
end
