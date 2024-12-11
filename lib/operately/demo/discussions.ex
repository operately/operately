defmodule Operately.Demo.Discussions do
  alias Operately.Demo.Resources
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
      content: PoorMansMarkdown.from_markdown(data.content),
      post_as_draft: false,
      send_to_everyone: true,
      subscription_parent_type: :message,
      subscriber_ids: []
    })

    update_inserted_at(discussion, index)
    create_comments(resources, discussion, data[:comments])

    discussion
  end

  # no comments to create
  defp create_comments(_, discussion, nil), do: {:ok, discussion}

  defp create_comments(resources, discussion, comments) do
    comments
    |> Enum.with_index()
    |> Enum.map(fn {comment, index} -> create_comment(resources, discussion, comment, index) end)
  end

  defp create_comment(resources, discussion, data, index) do
    author = Resources.get(resources, data.author)
    discussion = Operately.Repo.preload(discussion, :space)
    content = PoorMansMarkdown.from_markdown(data.content)

    {:ok, comment} = Operately.Operations.CommentAdding.run(author, discussion, "message", content)

    update_comment_inserted_at(comment, index)
  end

  # if every comment is inserted at the same time, they will have the same inserted_at value
  # and the sorting will not have a well defined order

  defp update_inserted_at(discussion, index) do
    discussion
    |> Operately.Messages.Message.changeset(%{inserted_at: NaiveDateTime.add(discussion.inserted_at, index, :second)})
    |> Operately.Repo.update()
  end

  defp update_comment_inserted_at(comment, index) do
    comment
    |> Operately.Updates.Comment.changeset(%{inserted_at: NaiveDateTime.add(comment.inserted_at, index, :second)})
    |> Operately.Repo.update()
  end


end
