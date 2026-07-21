defmodule Operately.Operations.ResourceHubDocumentEditing do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.Parent
  alias Operately.ResourceHubs.{Document, DocumentVersion}
  alias Operately.Notifications.SubscriptionList
  alias Operately.Operations.Notifications.Subscription
  alias Operately.Operations.SubscriptionsListEditing

  def run(author, document, attrs) do
    Multi.new()
    |> Multi.run(:locked_document, fn repo, _changes -> Locking.lock_for_update(repo, document) end)
    |> Multi.run(:expected_version, fn _repo, %{locked_document: locked} ->
      check_expected_version(locked, attrs)
    end)
    |> Multi.merge(fn %{locked_document: locked} ->
      cond do
        title_or_content_changed?(locked, attrs) and locked.state == :draft ->
          draft_content_change_multi(locked, attrs)

        title_or_content_changed?(locked, attrs) ->
          content_change_multi(author, document, locked, attrs)

        should_update_subscriptions?(attrs) ->
          subscriptions_only_multi(locked, attrs)

        true ->
          Multi.new() |> Multi.put(:document, locked)
      end
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{document: document}} -> {:ok, document}
      {:error, _step, :version_conflict, _changes} -> {:error, :version_conflict}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp draft_content_change_multi(locked, attrs) do
    Multi.new()
    |> Multi.update(:document, Document.changeset(locked, %{
      name: attrs.name,
      content: attrs.content
    }))
    |> Multi.run(:subscription_list, fn _, changes ->
      load_and_maybe_update_subscriptions(changes.document.id, attrs)
    end)
    |> Subscription.update_mentioned_people(attrs.content)
  end

  defp content_change_multi(author, original_document, locked, attrs) do
    next_version = locked.current_version + 1

    Multi.new()
    |> Multi.update(:document, Document.changeset(locked, %{
      name: attrs.name,
      content: attrs.content,
      current_version: next_version
    }))
    |> Multi.insert(:version, fn changes ->
      DocumentVersion.changeset(%{
        document_id: changes.document.id,
        version_number: next_version,
        title: changes.document.name,
        content: changes.document.content,
        editor_id: author.id,
        origin: :edited
      })
    end)
    |> Multi.run(:subscription_list, fn _, changes ->
      load_and_maybe_update_subscriptions(changes.document.id, attrs)
    end)
    |> Subscription.update_mentioned_people(attrs.content)
    |> Activities.insert_sync(author.id, :resource_hub_document_edited, fn _changes ->
      %{
        resource_hub_id: original_document.resource_hub.id,
        node_id: original_document.node_id,
        document_id: original_document.id,
        content: attrs.content
      }
      |> Map.merge(Parent.parent_fields(original_document.resource_hub))
    end)
  end

  defp subscriptions_only_multi(locked, attrs) do
    Multi.new()
    |> Multi.put(:document, locked)
    |> Multi.run(:subscription_list, fn _, _changes ->
      load_and_maybe_update_subscriptions(locked.id, attrs)
    end)
  end

  defp check_expected_version(locked, attrs) do
    case attrs[:expected_version] do
      nil -> {:ok, :ok}
      expected when expected == locked.current_version -> {:ok, :ok}
      _ -> {:error, :version_conflict}
    end
  end

  defp title_or_content_changed?(locked, attrs) do
    attrs.name != locked.name or attrs.content != locked.content
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
