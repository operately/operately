defmodule Operately.Operations.CommentEditing do
  alias Operately.Repo
  alias Operately.Updates.Comment

  def run(comment_id, new_content) do
    comment = Operately.Updates.get_comment!(comment_id)
    changeset = Comment.changeset(comment, %{content: %{"message" => new_content}})

    Repo.update(changeset)
    |> case do
      {:ok, comment} ->
        OperatelyWeb.ApiSocket.broadcast!("api:discussion_comments:#{comment.entity_id}")
        {:ok, comment}

      error -> error
    end
  end
end
