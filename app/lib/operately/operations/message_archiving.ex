defmodule Operately.Operations.MessageArchiving do
  alias Ecto.Multi
  alias Operately.{Activities, Repo}
  alias Operately.Messages.Permissions
  alias Operately.Operations.Discussions.SharedSteps
  alias Operately.Search.IndexUpdates

  def run(author, message) do
    Multi.new()
    |> SharedSteps.lock_message(author, message.id)
    |> Multi.run(:permission, fn _, %{current: current} ->
      with {:ok, :allowed} <- Permissions.check(author, current, :can_archive_message, company_read_only: false),
           :ok <- can_discard(message, current) do
        {:ok, :allowed}
      end
    end)
    |> Multi.run(:message, fn repo, %{current: current} -> repo.soft_delete(current) end)
    |> SharedSteps.cancel_job(message.id)
    |> Multi.merge(fn %{current: current} -> record_activity(Multi.new(), author, current) end)
    |> IndexUpdates.enqueue(:search_discussion, "discussion", message.id)
    |> Repo.transaction()
    |> SharedSteps.result()
  end

  defp can_discard(%{state: state}, %{state: :published}) when state != :published, do: {:error, :forbidden}
  defp can_discard(_, %{state: :published, messages_board_id: nil}), do: {:error, :forbidden}
  defp can_discard(_, _), do: :ok

  defp record_activity(multi, author, %{state: :published} = message) do
    space = Repo.preload(message, :space).space

    Activities.insert_sync(multi, author.id, :message_archiving, fn _ ->
      %{company_id: space.company_id, space_id: space.id, message_id: message.id, title: message.title}
    end)
  end

  defp record_activity(multi, _, _), do: multi
end
