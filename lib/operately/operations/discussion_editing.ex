defmodule Operately.Operations.DiscussionEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities

  def run(creator, discussion, title, message) do
    space = Operately.Groups.get_group!(discussion.updatable_id)
    update = Operately.Updates.Update.changeset(discussion, %{
      content: %{
        title: title,
        body: Jason.decode!(message)
      }
    })

    Multi.new()
    |> Multi.update(:update, update)
    |> Activities.insert(creator.id, :discussion_editing, fn changes -> %{
      company_id: space.company_id,
      space_id: space.id,
      discussion_id: changes.update.id,
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:update)
  end
end
