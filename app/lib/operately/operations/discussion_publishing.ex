defmodule Operately.Operations.DiscussionPublishing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Messages.Message

  def run(creator, discussion) do
    Multi.new()
    |> Multi.update(:message, Message.changeset(discussion, %{state: :published}))
    |> Activities.insert_sync(creator.id, :discussion_posting, fn _changes -> %{
      company_id: creator.company_id,
      space_id: discussion.space.id,
      discussion_id: discussion.id,
      title: discussion.title,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:message)
  end
end
