defmodule Operately.Operations.GroupCreation do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Groups
  alias Operately.Groups.Member

  def run(creator, attrs) do
    attrs = Map.merge(attrs, %{
      company_id: creator.company_id,
    })

    Multi.new()
    |> Groups.insert_group(attrs)
    |> Multi.insert(:creator, fn %{group: group} ->
      Member.changeset(%{group_id: group.id, person_id: creator.id})
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:group)
  end
end
