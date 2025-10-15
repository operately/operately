defmodule Operately.Operations.ResourceHubDocumentEditing do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.ResourceHubs.{Document, Node}
  alias Operately.Notifications.SubscriptionList
  alias Operately.Operations.Notifications.Subscription
  alias Operately.Operations.SubscriptionsListEditing

  def run(author, document, attrs) do
    Multi.new()
    |> Multi.update(:document, Document.changeset(document, %{content: attrs.content}))
    |> Multi.update(:node, fn changes ->
      Node.changeset(document.node, %{
        name: attrs.name,
        updated_at: changes.document.updated_at
      })
    end)
    |> Multi.run(:subscription_list, fn _, changes ->
      with {:ok, subscription_list} <-
             SubscriptionList.get(:system,
               parent_id: changes.document.id,
               opts: [preload: :subscriptions]
             ),
           {:ok, subscription_list} <- maybe_update_subscriptions(subscription_list, attrs) do
        {:ok, subscription_list}
      end
    end)
    |> Subscription.update_mentioned_people(attrs.content)
    |> Activities.insert_sync(author.id, :resource_hub_document_edited, fn _changes ->
      %{
        company_id: author.company_id,
        space_id: document.resource_hub.space_id,
        resource_hub_id: document.resource_hub.id,
        node_id: document.node_id,
        document_id: document.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:document)
  end

  defp maybe_update_subscriptions(subscription_list, attrs) do
    if should_update_subscriptions?(attrs) do
      attrs_for_update = %{
        send_notifications_to_everyone: attrs[:send_to_everyone],
        subscriber_ids: attrs[:subscriber_ids] || [],
      }

      case SubscriptionsListEditing.run(subscription_list, attrs_for_update) do
        {:ok, _} -> SubscriptionList.get(:system, id: subscription_list.id, opts: [preload: :subscriptions])
        {:error, _operation, reason, _changes} -> {:error, reason}
      end
    else
      {:ok, subscription_list}
    end
  end

  defp should_update_subscriptions?(attrs) do
    not is_nil(attrs[:subscriber_ids]) or not is_nil(attrs[:send_to_everyone])
  end
end
