defmodule Operately.Operations.ResourceHubDocumentPublicSharing do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.Parent

  def run(author, document, enabled) do
    Multi.new()
    |> Multi.run(:locked, fn repo, _ -> Locking.lock_for_update(repo, document) end)
    |> Multi.merge(fn %{locked: locked} -> update_sharing(author, document, locked, enabled) end)
    |> Repo.transaction()
    |> case do
      {:ok, %{document: document}} -> {:ok, document}
      {:error, _step, reason, _changes} -> {:error, reason}
    end
  end

  defp update_sharing(_author, _document, %{state: :draft}, true) do
    Multi.new() |> Multi.error(:document, :draft)
  end

  defp update_sharing(author, document, locked, enabled) do
    if enabled == (not is_nil(locked.public_token)) do
      Multi.new() |> Multi.put(:document, locked)
    else
      token = if enabled, do: Base.url_encode64(:crypto.strong_rand_bytes(32), padding: false), else: nil

      Multi.new()
      |> Multi.update(:document, Ecto.Changeset.change(locked, public_token: token))
      |> Activities.insert_sync(author.id, :resource_hub_document_public_sharing_changed, fn _ ->
        Parent.parent_fields(document.resource_hub)
        |> Map.merge(%{resource_hub_id: document.resource_hub.id, node_id: document.node_id, document_id: document.id, enabled: enabled})
      end)
    end
  end
end
