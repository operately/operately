defmodule Operately.Data.FixCommentMessageFormat do
  alias Operately.Repo
  alias Operately.Updates.Comment

  def run do
    comments = Repo.all(Comment)

    comments_with_content = Enum.filter(comments, fn comment ->
      comment.content["message"] != nil
    end)

    comments_with_string_content = Enum.filter(comments_with_content, fn comment ->
      is_binary(comment.content["message"])
    end)

    comments_with_string_content
    |> Enum.map(fn comment ->
      message = Jason.decode!(comment.content["message"])

      comment
      |> Comment.changeset(%{content: %{message: message}})
      |> Repo.update()
    end)
  end
end
