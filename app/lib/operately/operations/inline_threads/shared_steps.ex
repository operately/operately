defmodule Operately.Operations.InlineThreads.SharedSteps do
  alias Ecto.Multi
  alias Operately.Comments.InlineThread
  alias Operately.Repo.Locking
  alias Operately.ResourceHubs.{Document, Permissions}

  def lock_document(multi, person, document_id) do
    Multi.run(multi, :document, fn repo, _ ->
      with {:ok, locked} <- Locking.lock_for_update(repo, %Document{id: document_id}),
           {:ok, %Document{state: :published} = current} <- Document.get(person, id: document_id),
           # The endpoint checks company read-only state. Recheck document access after waiting for the lock.
           {:ok, :allowed} <- Permissions.check(current.request_info.access_level, :can_comment_on_document, company_read_only: false) do
        {:ok, locked}
      else
        {:ok, _} -> {:error, :not_found}
        error -> error
      end
    end)
  end

  def lock_thread(multi, thread) do
    Multi.run(multi, :thread, fn repo, _ -> Locking.lock_for_update(repo, thread) end)
  end

  def lock_message(multi, message) do
    Multi.run(multi, :message, fn repo, _ -> Locking.lock_for_update(repo, message) end)
  end

  def require_open_thread(multi) do
    Multi.run(multi, :open_thread, fn _, %{thread: locked} ->
      if locked.resolved_at, do: {:error, :thread_resolved}, else: {:ok, locked}
    end)
  end

  def validate_content(multi, content) do
    Multi.run(multi, :valid_content, fn _, _ ->
      case content do
        %{"type" => "doc", "content" => children} when is_list(children) and children != [] -> {:ok, content}
        _ -> {:error, :invalid_content}
      end
    end)
  end

  def preload_thread(multi, key) do
    Multi.run(multi, :loaded_thread, fn repo, changes ->
      case Map.fetch!(changes, key) do
        nil -> {:ok, nil}
        thread -> {:ok, thread |> repo.preload(InlineThread.preloads(), force: true) |> InlineThread.set_anchor_version()}
      end
    end)
  end

  def result({:ok, changes}, key), do: {:ok, Map.fetch!(changes, key)}
  def result({:error, _, %Ecto.Changeset{}, _}, _key), do: {:error, :invalid_content}
  def result({:error, _, reason, _}, _key), do: {:error, reason}
end
