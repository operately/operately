defmodule Operately.Operations.InlineThreadCreating do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Comments.{InlineAnchor, InlineThread}
  alias Operately.Updates.Comment
  alias Operately.Operations.InlineThreads.SharedSteps

  def run(author, document, attrs) do
    Multi.new()
    |> SharedSteps.lock_document(author, document.id)
    |> Multi.run(:version, fn _, %{document: locked} ->
      if attrs.source_version == locked.current_version, do: {:ok, locked.current_version}, else: {:error, :version_conflict}
    end)
    |> SharedSteps.validate_content(attrs.content)
    |> Multi.run(:anchor, fn _, %{document: locked} ->
      InlineAnchor.build(locked.content, locked.current_version, attrs.from, attrs.to, attrs.quote)
    end)
    |> Multi.insert(:thread, fn %{anchor: anchor} ->
      InlineThread.changeset(%{resource_type: :resource_hub_document, resource_id: document.id, author_id: author.id, anchor: anchor})
    end)
    |> Multi.insert(:message, fn %{thread: thread} ->
      Comment.changeset(%{entity_id: thread.id, entity_type: :inline_thread, author_id: author.id, content: attrs.content})
    end)
    |> SharedSteps.preload_thread(:thread)
    |> Repo.transaction()
    |> SharedSteps.result(:loaded_thread)
  end
end
