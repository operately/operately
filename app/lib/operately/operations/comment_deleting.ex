defmodule Operately.Operations.CommentDeleting do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Repo

  def run(author, comment) do
    Multi.new()
    |> Multi.delete(:comment, comment)
    |> record_activity(author)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
    |> case do
      {:ok, comment} ->
        OperatelyWeb.ApiSocket.broadcast!("api:reload_comments:#{comment.entity_id}")
        {:ok, comment}

      error ->
        error
    end
  end

  defp record_activity(multi, author) do
    Activities.insert_sync(
      multi,
      author.id,
      :comment_deleted,
      fn %{comment: comment} ->
        %{
          company_id: author.company_id,
          comment_id: comment.id,
          parent_type: comment.entity_type,
          parent_id: comment.entity_id
        }
      end,
      include_notification: false
    )
  end
end
