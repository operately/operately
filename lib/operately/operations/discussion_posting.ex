defmodule Operately.Operations.DiscussionPosting do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, space, title, message) do
    update = Operately.Updates.Update.changeset(%{
      author_id: creator.id,
      updatable_id: space.id,
      updatable_type: "space",
      type: "project_discussion",
      content: %{
        title: title,
        body: Jason.decode!(message)
      }
    })

    Multi.new()
    |> Multi.insert(:update, update)
    |> Activities.insert_sync(creator.id, :discussion_posting, fn changes -> %{
      company_id: space.company_id,
      space_id: space.id,
      discussion_id: changes.update.id,
      title: title,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end
end
