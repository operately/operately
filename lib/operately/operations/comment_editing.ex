defmodule Operately.Operations.CommentEditing do
  alias Ecto.Multi
  alias Operately.Updates.Comment
  alias Operately.Notifications.SubscriptionList
  alias Operately.{Repo, RichContent, Notifications}

  def run(comment, new_content) do
    changeset = Comment.changeset(comment, %{content: %{"message" => new_content}})
    ids = RichContent.find_mentioned_ids(new_content, :decode_ids)

    Multi.new()
    |> Multi.update(:comment, changeset)
    |> update_subscriptions(comment, ids)
    |> Repo.transaction()
    |> Repo.extract_result(:comment)
    |> case do
      {:ok, comment} ->
        OperatelyWeb.ApiSocket.broadcast!("api:discussion_comments:#{comment.entity_id}")
        {:ok, comment}

      error -> error
    end
  end

  defp update_subscriptions(multi, _, []), do: multi

  # When subscriptions are added to all resources that use Operately.Operations.CommentEditing,
  # the entity_type pattern match should be removed.
  defp update_subscriptions(multi, comment = %{entity_type: :project_check_in}, ids) do
    {:ok, list} = SubscriptionList.get(:system, parent_id: comment.entity_id, opts: [preload: :subscriptions])

    Enum.reduce(ids, multi, fn id, multi ->
      name = "subscription_" <> id

      Multi.run(multi, name, fn _, _ ->
        if subscription_exists?(list.subscriptions, id) do
          {:ok, nil}
        else
          Notifications.create_subscription(%{
            subscription_list_id: list.id,
            person_id: id,
            type: :mentioned,
          })
        end
      end)
    end)
  end

  defp update_subscriptions(multi, _, _), do: multi

  #
  # Helpers
  #

  defp subscription_exists?(subscriptions, id) do
    Enum.any?(subscriptions, &(&1.person_id == id))
  end
end
