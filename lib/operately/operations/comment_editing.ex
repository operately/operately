defmodule Operately.Operations.CommentEditing do
  alias Operately.Repo
  alias Operately.Updates.Comment

  def run(comment, new_content) do
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
