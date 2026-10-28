defmodule Operately.Operations.InlineThreadMessageEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Operations.InlineThreads.SharedSteps

  def run(author, thread, message, content) do
    Multi.new()
    |> SharedSteps.lock_document(author, thread.resource_id)
    |> SharedSteps.lock_thread(thread)
    |> SharedSteps.lock_message(message)
    |> SharedSteps.validate_content(content)
    |> Multi.update(:updated_message, fn %{message: locked} -> Comment.changeset(locked, %{content: content}) end)
    |> SharedSteps.preload_thread(:thread)
    |> Repo.transaction()
    |> SharedSteps.result(:loaded_thread)
  end
end
