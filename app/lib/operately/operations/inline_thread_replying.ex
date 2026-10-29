defmodule Operately.Operations.InlineThreadReplying do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Operations.InlineThreads.SharedSteps

  def run(author, thread, content) do
    Multi.new()
    |> SharedSteps.lock_document(author, thread.resource_id)
    |> SharedSteps.lock_thread(thread)
    |> SharedSteps.validate_content(content)
    |> Multi.insert(:message, fn %{thread: locked} ->
      Comment.changeset(%{entity_id: locked.id, entity_type: :inline_thread, author_id: author.id, content: content})
    end)
    |> Operately.Operations.InlineThreads.Events.comment(author)
    |> SharedSteps.preload_thread(:thread)
    |> Repo.transaction()
    |> SharedSteps.result(:loaded_thread)
  end
end
