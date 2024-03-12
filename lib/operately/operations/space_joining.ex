defmodule Operately.Operations.SpaceJoining do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Groups.Member
  alias Operately.Activities

  def run(author, space_id) do
    space = Operately.Groups.get_group!(space_id)

    changeset = Member.changeset(%{
      group_id: space_id, 
      person_id: author.id
    })

    Multi.new()
    |> Multi.insert(:member, changeset)
    |> Activities.insert_sync(author.id, :space_joining, fn _changes ->
      %{
        company_id: space.company_id,
        space_id: space.id
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:member)
  end
end
