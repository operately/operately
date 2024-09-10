defmodule Operately.Operations.CommentAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Operations.CommentAdding.{Activity, Subscriptions}

  def run(creator, entity, entity_type, content) do
    changeset = Comment.changeset(%{
      author_id: creator.id,
      entity_id: entity.id,
      entity_type: String.to_existing_atom(entity_type),
      content: %{"message" => content}
    })
    action = find_action(entity)

    Multi.new()
    |> Multi.insert(:comment, changeset)
    |> Subscriptions.update(action, content)
    |> Activity.insert(creator, action, entity)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
    |> case do
      {:ok, comment} ->
        OperatelyWeb.ApiSocket.broadcast!("api:discussion_comments:#{comment.entity_id}")
        {:ok, comment}

      error -> error
    end
  end

  #
  # Helpers
  #

  defp find_action(%Operately.Updates.Update{type: :project_discussion}), do: :discussion_comment_submitted
  defp find_action(%Operately.Updates.Update{type: :goal_check_in}), do: :goal_check_in_commented
  defp find_action(%Operately.Projects.CheckIn{}), do: :project_check_in_commented
  defp find_action(%Operately.Comments.CommentThread{}), do: :comment_added
  defp find_action(e), do: raise("Unknown entity type #{inspect(e)}")
end
