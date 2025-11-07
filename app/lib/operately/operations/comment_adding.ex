defmodule Operately.Operations.CommentAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Notifications.{Subscription, SubscriptionList}
  alias Operately.Updates.Comment
  alias Operately.Operations.CommentAdding.{Activity, Subscriptions}

  def run(creator, entity, entity_type, content, subscriber_ids \\ nil) do
    changeset =
      Comment.changeset(%{
        author_id: creator.id,
        entity_id: entity.id,
        entity_type: entity_type,
        content: %{"message" => content}
      })

    action = find_action(entity)

    Multi.new()
    |> Multi.insert(:comment, changeset)
    |> Subscriptions.update(action, content, subscriber_ids)
    |> ensure_subscription_step(creator)
    |> Activity.insert(creator, action, entity)
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

  #
  # Helpers
  #

  defp find_action(%Operately.Messages.Message{}), do: :discussion_comment_submitted
  defp find_action(%Operately.Goals.Update{}), do: :goal_check_in_commented
  defp find_action(%Operately.Projects.CheckIn{}), do: :project_check_in_commented
  defp find_action(%Operately.Projects.Retrospective{}), do: :project_retrospective_commented
  defp find_action(%Operately.Comments.CommentThread{}), do: :comment_added
  defp find_action(%Operately.ResourceHubs.Document{}), do: :resource_hub_document_commented
  defp find_action(%Operately.ResourceHubs.File{}), do: :resource_hub_file_commented
  defp find_action(%Operately.ResourceHubs.Link{}), do: :resource_hub_link_commented
  defp find_action(%Operately.Tasks.Task{}), do: :project_task_commented
  defp find_action(e), do: raise("Unknown entity type #{inspect(e)}")

  defp ensure_subscription_step(multi, creator) do
    Multi.run(multi, :comment_author_subscription, fn _, changes ->
      subscription_list =
        case Map.fetch(changes, :subscription_list) do
          {:ok, list} -> {:ok, list}
          :error -> SubscriptionList.get(:system, id: changes.comment.entity_id)
        end

      case subscription_list do
        {:ok, list} -> ensure_subscription(list.id, creator.id)
        {:error, :not_found} -> {:ok, nil}
      end
    end)
  end

  defp ensure_subscription(subscription_list_id, person_id) do
    case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
      {:error, :not_found} ->
        Operately.Notifications.create_subscription(%{
          subscription_list_id: subscription_list_id,
          person_id: person_id,
          type: :joined
        })

      {:ok, subscription} ->
        Operately.Notifications.update_subscription(subscription, %{canceled: false})
    end
  end
end
