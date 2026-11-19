defmodule Operately.Operations.InlineThreadMessageDeleting do
  import Ecto.Query, only: [from: 2]
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Updates.Comment
  alias Operately.Operations.InlineThreads.SharedSteps

  def run(author, thread, message) do
    Multi.new()
    |> SharedSteps.lock_document(author, thread.resource_id)
    |> SharedSteps.lock_thread(thread)
    |> SharedSteps.lock_message(message)
    |> Multi.delete(:deleted_message, fn %{message: locked} -> locked end)
    |> Multi.run(:remaining_thread, fn repo, %{thread: thread} ->
      if repo.exists?(from(c in Comment, where: c.entity_id == ^thread.id and c.entity_type == :inline_thread)) do
        {:ok, thread}
      else
        with {:ok, _} <- repo.delete(thread), do: {:ok, nil}
      end
    end)
    |> SharedSteps.preload_thread(:remaining_thread)
    |> Repo.transaction()
    |> SharedSteps.result(:loaded_thread)
  end
end
