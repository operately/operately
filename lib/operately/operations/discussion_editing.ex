defmodule Operately.Operations.DiscussionEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, discussion, space, attrs) do
    update = Operately.Updates.Update.changeset(discussion, %{
      content: %{
        title: attrs.title,
        body: Jason.decode!(attrs.body)
      }
    })

    Multi.new()
    |> Multi.update(:update, update)
    |> Activities.insert_sync(creator.id, :discussion_editing, fn changes -> %{
      company_id: space.company_id,
      space_id: space.id,
      discussion_id: changes.update.id,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end
end
