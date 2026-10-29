defmodule Operately.Operations.InlineThreadResolving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Operations.InlineThreads.SharedSteps

  def run(author, thread) do
    Multi.new()
    |> SharedSteps.lock_document(author, thread.resource_id)
    |> SharedSteps.lock_thread(thread)
    |> Multi.update(:resolved_thread, fn %{thread: locked} ->
      if locked.resolved_at do
        Ecto.Changeset.change(locked)
      else
        Ecto.Changeset.change(locked, resolved_at: Operately.Time.utc_datetime_now(), resolved_by_id: author.id)
      end
    end)
    |> Operately.Operations.InlineThreads.Events.resolution(author, :resolved_thread)
    |> SharedSteps.preload_thread(:resolved_thread)
    |> Repo.transaction()
    |> SharedSteps.result(:loaded_thread)
  end
end
