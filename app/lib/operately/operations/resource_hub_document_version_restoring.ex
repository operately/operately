defmodule Operately.Operations.ResourceHubDocumentVersionRestoring do
  alias Ecto.Multi
  alias Operately.{Repo, Activities}
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.Parent
  alias Operately.ResourceHubs.{Document, DocumentVersion}
  alias Operately.Notifications.SubscriptionList
  alias Operately.Operations.Notifications.Subscription

  def run(author, document, attrs) do
    Multi.new()
    |> Multi.run(:locked_document, fn repo, _changes -> Locking.lock_for_update(repo, document) end)
    |> Multi.run(:expected_version, fn _repo, %{locked_document: locked} ->
      check_expected_version(locked, attrs.expected_current_version)
    end)
    |> Multi.run(:source_version, fn _repo, %{locked_document: locked} ->
      find_source_version(locked.id, attrs.version_number)
    end)
    |> Multi.merge(fn %{locked_document: locked, source_version: source} ->
      if identical?(locked, source) do
        Multi.new()
        |> Multi.put(:document, locked)
        |> Multi.put(:restored_version, nil)
      else
        restore_multi(author, document, locked, source)
      end
    end)
    |> Repo.transaction()
    |> case do
      {:ok, changes} ->
        {:ok, %{document: changes.document, restored_version: changes.restored_version}}

      {:error, _step, :version_conflict, _changes} ->
        {:error, :version_conflict}

      {:error, _step, :not_found, _changes} ->
        {:error, :not_found}

      {:error, _step, reason, _changes} ->
        {:error, reason}
    end
  end

  defp restore_multi(author, original_document, locked, source) do
    next_version = locked.current_version + 1

    Multi.new()
    |> Multi.update(:document, Document.changeset(locked, %{
      name: source.title,
      content: source.content,
      current_version: next_version
    }))
    |> Multi.insert(:restored_version, fn changes ->
      DocumentVersion.changeset(%{
        document_id: changes.document.id,
        version_number: next_version,
        title: changes.document.name,
        content: changes.document.content,
        editor_id: author.id,
        origin: :restored,
        restored_from_version_number: source.version_number
      })
    end)
    |> Multi.run(:subscription_list, fn _, changes ->
      SubscriptionList.get(:system,
        parent_id: changes.document.id,
        opts: [preload: :subscriptions]
      )
    end)
    |> Subscription.update_mentioned_people(source.content)
    |> Activities.insert_sync(author.id, :resource_hub_document_version_restored, fn _changes ->
      %{
        resource_hub_id: original_document.resource_hub.id,
        node_id: original_document.node_id,
        document_id: original_document.id,
        version_number: source.version_number
      }
      |> Map.merge(Parent.parent_fields(original_document.resource_hub))
    end)
  end

  defp check_expected_version(locked, expected) do
    if expected == locked.current_version do
      {:ok, :ok}
    else
      {:error, :version_conflict}
    end
  end

  defp find_source_version(document_id, version_number) do
    case DocumentVersion.get_by_document_and_number(document_id, version_number) do
      nil -> {:error, :not_found}
      version -> {:ok, version}
    end
  end

  defp identical?(locked, source) do
    locked.name == source.title and locked.content == source.content
  end
end
