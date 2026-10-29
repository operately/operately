defmodule Operately.Operations.InlineThreads.Events do
  alias Ecto.Multi
  alias Operately.Activities
  alias Operately.Notifications.SubscriptionList
  alias Operately.Operations.Notifications.Subscription, as: Subscriptions
  alias Operately.ResourceHubs.Parent

  def comment(multi, author) do
    multi
    |> Multi.run(:subscription_list, fn _, %{document: document} ->
      SubscriptionList.get(:system, id: document.subscription_list_id)
    end)
    |> Multi.run(:document_subscriptions, fn _, %{subscription_list: list, message: message} ->
      # Existing cancellations remain effective, even when someone replies or is mentioned again.
      ids =
        [author.id | Operately.RichContent.find_mentioned_ids(message.content, :decode_ids)]
        |> Enum.uniq()
        |> Enum.filter(&match?({:ok, _}, Operately.Comments.InlineThread.get(&1, id: message.entity_id)))

      Enum.reduce_while(ids, {:ok, []}, fn id, {:ok, subscriptions} ->
        type = if id == author.id, do: :joined, else: :mentioned

        case Subscriptions.insert_if_missing(list.id, id, type) do
          {:ok, subscription} -> {:cont, {:ok, [subscription | subscriptions]}}
          {:error, reason} -> {:halt, {:error, reason}}
        end
      end)
    end)
    |> Activities.insert_sync(author.id, :resource_hub_document_commented, fn changes ->
      document_fields(changes.document)
      |> Map.merge(%{comment_id: changes.message.id, inline_thread_id: changes.thread.id})
    end)
  end

  def resolution(multi, author, result_key) do
    Multi.merge(multi, fn changes ->
      if changes.thread.resolved_at == changes[result_key].resolved_at do
        Multi.new()
      else
        Activities.insert_sync(
          Multi.new(),
          author.id,
          :resource_hub_document_inline_thread_resolution_changed,
          fn _ ->
            document_fields(changes.document)
            |> Map.merge(%{inline_thread_id: changes.thread.id, resolved: not is_nil(changes[result_key].resolved_at)})
          end,
          include_notification: false
        )
      end
    end)
  end

  defp document_fields(document) do
    document = Parent.preload_child_resource_hub(document)

    Parent.parent_fields(document.resource_hub)
    |> Map.merge(%{resource_hub_id: document.resource_hub.id, document_id: document.id, node_id: document.node.id})
  end
end
