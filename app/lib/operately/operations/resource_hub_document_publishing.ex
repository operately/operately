defmodule Operately.Operations.ResourceHubDocumentPublishing do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.Parent
  alias Operately.ResourceHubs.{Document, DocumentVersion}
  alias Operately.Notifications.SubscriptionList
  alias Operately.Operations.Notifications.Subscription
  alias Operately.Operations.SubscriptionsListEditing

  def run(author, document, attrs) do
    Multi.new()
    |> Multi.run(:locked_document, fn repo, _changes -> Locking.lock_for_update(repo, document) end)
    |> Multi.merge(fn %{locked_document: locked} ->
      publish_multi(author, document, locked, attrs)
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:result)
  end

  defp publish_multi(author, original_document, locked, attrs) do
    Multi.new()
    |> update_document(locked, attrs)
    |> insert_created_version(author)
    |> Multi.run(:subscription_list, fn _, changes ->
      load_and_maybe_update_subscriptions(changes.document.id, attrs)
    end)
    |> Subscription.update_mentioned_people(attrs[:content] || locked.content)
    |> Multi.run(:result, fn _, changes ->
      {:ok, Map.put(changes.document, :node, original_document.node)}
    end)
    |> insert_activity(author, original_document)
  end

  defp update_document(multi, document, attrs) do
    updates =
      %{state: :published}
      |> maybe_put(:name, attrs[:name])
      |> maybe_put(:content, attrs[:content])

    Multi.update(multi, :document, Document.changeset(document, updates))
  end

  defp insert_created_version(multi, author) do
    Multi.insert(multi, :version, fn changes ->
      DocumentVersion.changeset(%{
        document_id: changes.document.id,
        version_number: 1,
        title: changes.document.name,
        content: changes.document.content,
        editor_id: author.id,
        origin: :created
      })
    end)
  end

  defp insert_activity(multi, author, document) do
    Activities.insert_sync(multi, author.id, :resource_hub_document_created, fn changes ->
      %{
        resource_hub_id: document.resource_hub.id,
        document_id: document.id,
        node_id: document.node_id,
        name: changes.document.name,
      }
      |> Map.merge(Parent.parent_fields(document.resource_hub))
    end)
  end

  defp load_and_maybe_update_subscriptions(document_id, attrs) do
    with {:ok, subscription_list} <-
           SubscriptionList.get(:system,
             parent_id: document_id,
             opts: [preload: :subscriptions]
           ),
         {:ok, subscription_list} <- maybe_update_subscriptions(subscription_list, attrs) do
      {:ok, subscription_list}
    end
  end

  defp maybe_update_subscriptions(subscription_list, attrs) do
    if should_update_subscriptions?(attrs) do
      attrs_for_update = %{
        send_notifications_to_everyone: attrs[:send_notifications_to_everyone],
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

  defp maybe_put(map, _key, nil), do: map
  defp maybe_put(map, key, value), do: Map.put(map, key, value)
end
