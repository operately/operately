defmodule Operately.Demo.Discussions do
  alias Operately.Demo.Resources
  alias Operately.Operations.DiscussionPosting
  alias Operately.Demo.PoorMansMarkdown

  # no discussions to create
  def create_discussions(resources, nil), do: resources

  def create_discussions(resources, data) do
    Resources.create(resources, data, fn {resources, data} ->
      create_discussion(resources, data)
    end)
  end

  defp create_discussion(resources, data) do
    author = Resources.get(resources, data.author)
    space = Resources.get(resources, data.space)
    board = Operately.Messages.get_messages_board(space_id: space.id)

    {:ok, discussion} = DiscussionPosting.run(author, space, %{
      messages_board_id: board.id,
      title: data.title,
      content: PoorMansMarkdown.from_markdown(data.content),
      post_as_draft: false,
      send_to_everyone: true,
      subscription_parent_type: :message,
      subscriber_ids: []
    })

    {:ok, _} = create_comments(resources, discussion, data[:comments])

    discussion
  end

  # no comments to create
  defp create_comments(_, discussion, nil), do: {:ok, discussion}

  defp create_comments(resources, discussion, comments) do
    Enum.map(comments, fn comment ->
      {:ok, _} = create_comment(resources, discussion, comment)
    end)

    {:ok, discussion}
  end

  defp create_comment(resources, discussion, data) do
    author = Resources.get(resources, data.author)
    discussion = Operately.Repo.preload(discussion, :space)
    content = PoorMansMarkdown.from_markdown(data.content)
    Operately.Operations.CommentAdding.run(author, discussion, "message", content)
  end


end
