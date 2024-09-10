defmodule Operately.Operations.CommentAdding.Subscriptions do
  alias Ecto.Multi
  alias Operately.Notifications

  def update(multi, :project_check_in_commented, content) do
    multi
    |> fetch_subscriptions()
    |> update_subscriptions(content)
  end
  def update(multi, _, _), do: multi

  defp fetch_subscriptions(multi) do
    multi
    |> Multi.run(:subscription_list, fn _, %{comment: comment} ->
      case Notifications.get_subscription_list_by_parent_id(comment.entity_id) do
        nil -> {:error, nil}
        subscription_list -> {:ok, subscription_list}
      end
    end)
  end

  defp update_subscriptions(multi, content) do
    ids = find_mentioned_people(content)

    Enum.reduce(ids, multi, fn id, multi ->
      name = "subscription_" <> id

      Multi.run(multi, name, fn _, changes ->
        if subscription_exists?(changes, id) do
          {:ok, nil}
        else
          Notifications.create_subscription(%{
            subscription_list_id: changes.subscription_list.id,
            person_id: id,
            type: :mentioned,
          })
        end
      end)
    end)
  end

  #
  # Helpers
  #

  defp subscription_exists?(changes, id) do
    Enum.any?(changes.subscription_list.subscriptions, &(&1.person_id == id))
  end

  defp find_mentioned_people(description) do
    {:ok, ids} =
      description
      |> Operately.RichContent.find_mentioned_ids()
      |> Enum.uniq()
      |> OperatelyWeb.Api.Helpers.decode_id()

    ids
  end
end
