defmodule Operately.Operations.DiscussionPublishing do
  import Ecto.Query
  alias Ecto.Multi
  alias Operately.Messages.{Message, Permissions}
  alias Operately.Operations.Discussions.SharedSteps
  alias Operately.Repo
  alias Operately.Search.IndexUpdates

  def run(author, %Message{id: id}), do: run(author, id)

  def run(requester, id) when is_binary(id) do
    Multi.new()
    |> SharedSteps.lock_message(requester, id)
    |> Multi.run(:publish, fn _, %{current: current} -> check_publication(requester, current) end)
    |> Multi.update(:message, fn %{current: current} -> Message.changeset(current, %{state: :published, scheduled_at: nil}) end)
    |> SharedSteps.update_schedule(nil)
    |> SharedSteps.record_activity()
    |> IndexUpdates.enqueue(:search_discussion, "discussion", id)
    |> Repo.transaction()
    |> case do
      {:error, :current, :not_found, _} when requester == :system -> {:ok, :skipped}
      {:error, :publish, :not_due, _} -> {:ok, :skipped}
      result -> SharedSteps.result(result)
    end
  end

  defp check_publication(:system, %{state: :scheduled} = message) do
    later_job = where(SharedSteps.pending_jobs(message.id), [j], j.scheduled_at > ^DateTime.utc_now())
    if Repo.exists?(later_job), do: {:error, :not_due}, else: {:ok, :due}
  end

  defp check_publication(:system, _message), do: {:error, :not_due}

  defp check_publication(author, message) do
    if Permissions.can_publish?(author, message), do: {:ok, :allowed}, else: {:error, :forbidden}
  end
end
