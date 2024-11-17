defmodule Operately.Operations.MessageArchiving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, message) do
    Multi.new()
    |> soft_delete_message(message)
    |> record_activity(author, message)
    |> Repo.transaction()
  end

  defp record_activity(multi, author, message) do
    if message.state == :draft do
      multi # do nothing
    else
      Activities.insert_sync(multi, author.id, :message_archiving, fn _changes ->
        %{
          company_id: author.company_id,
          space_id: message.space_id,
          message_id: message.id,
          title: message.title
        }
      end)
    end
  end

  defp soft_delete_message(multi, message) do
    Multi.run(multi, :delition, fn _, _ ->
      Repo.soft_delete(message)
    end)
  end
end
