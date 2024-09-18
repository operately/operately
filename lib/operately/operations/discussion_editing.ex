defmodule Operately.Operations.DiscussionEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Messages.Message

  def run(creator, message, attrs) do
    Multi.new()
    |> Multi.update(:message, Message.changeset(message, %{
      title: attrs.title,
      body: Jason.decode!(attrs.body),
    }))
    |> Activities.insert_sync(creator.id, :discussion_editing, fn _ -> %{
      company_id: creator.company_id,
      space_id: message.space_id,
      discussion_id: message.id,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:message)
  end
end
