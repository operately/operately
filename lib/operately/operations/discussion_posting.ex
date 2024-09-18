defmodule Operately.Operations.DiscussionPosting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, space, title, message) do
    message = Operately.Messages.Message.changeset(%{
      author_id: creator.id,
      space_id: space.id,
      title: title,
      body: Jason.decode!(message),
    })

    Multi.new()
    |> Multi.insert(:message, message)
    |> Activities.insert_sync(creator.id, :discussion_posting, fn changes -> %{
      company_id: space.company_id,
      space_id: space.id,
      discussion_id: changes.message.id,
      title: title,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:message)
  end
end
