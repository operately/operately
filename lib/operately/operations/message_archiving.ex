defmodule Operately.Operations.MessageArchiving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(author, _attrs) do
    raise "Operation for MessageArchiving not implemented"

    Multi.new()
    |> Multi.insert(:something, nil)
    |> Activities.insert_sync(author.id, :message_archiving, fn _changes ->
      %{
        company_id: "TODO",
        space_id: "TODO",
        message_id: "TODO"
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:something)
  end
end
