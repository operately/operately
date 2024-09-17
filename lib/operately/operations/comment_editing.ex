defmodule Operately.Operations.CommentEditing do
  alias Ecto.Multi
  alias Operately.Updates.Comment
  alias Operately.Operations.CommentEditing.Subscriptions
  alias Operately.Repo

  def run(comment, new_content) do
    changeset = Comment.changeset(comment, %{content: %{"message" => new_content}})

    Multi.new()
    |> Multi.update(:comment, changeset)
    |> Subscriptions.update(comment.entity_type, new_content)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
    |> case do
      {:ok, comment} ->
        OperatelyWeb.ApiSocket.broadcast!("api:discussion_comments:#{comment.entity_id}")
        {:ok, comment}

      error -> error
    end
  end
end
