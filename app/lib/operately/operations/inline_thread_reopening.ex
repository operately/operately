defmodule Operately.Operations.InlineThreadReopening do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Operations.InlineThreads.SharedSteps

  def run(author, thread) do
    Multi.new()
    |> SharedSteps.lock_document(author, thread.resource_id)
    |> SharedSteps.lock_thread(thread)
    |> Multi.update(:reopened_thread, fn %{thread: locked} -> Ecto.Changeset.change(locked, resolved_at: nil, resolved_by_id: nil) end)
    |> Operately.Operations.InlineThreads.Events.resolution(author, :reopened_thread)
    |> SharedSteps.preload_thread(:reopened_thread)
    |> Repo.transaction()
    |> SharedSteps.result(:loaded_thread)
  end
end
