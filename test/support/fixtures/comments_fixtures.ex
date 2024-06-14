defmodule Operately.CommentsFixtures do
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Comments.CommentThread

  def comment_fixture(author, attrs) do
    {:ok, comment} =
      attrs
      |> Enum.into(%{
        author_id: author.id,
        content: %{"message" => "some comment"}
      })
      |> Comment.changeset()
      |> Repo.insert()

    comment
  end

  def comment_thread_fixture(attrs) do
    {:ok, thread} =
      attrs
      |> Enum.into(%{
        parent_type: :activity,
        message: %{"message" => "some message"}
      })
      |> CommentThread.changeset()
      |> Repo.insert()

    thread
  end
end
