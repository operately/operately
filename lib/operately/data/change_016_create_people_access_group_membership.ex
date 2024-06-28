defmodule Operately.Data.Change016CreatePeopleAccessGroupMembership do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.People.Person

  def run do
    Repo.transaction(fn ->
      people_ids = from(p in Person, select: p.id) |> Repo.all()

      Enum.each(people_ids, fn person_id ->
        case create_group_membership(person_id) do
          {:error, _} -> raise "Failed to create access group membership"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_group_membership(person_id) do
    group = get_group(person_id)

    case Access.get_group_membership(person_id: person_id, group_id: group.id) do
      nil -> Access.create_group_membership(%{
        person_id: person_id,
        group_id: group.id,
      })
      _ -> :ok
    end
  end

  defp get_group(person_id) do
    case Access.get_group(person_id: person_id) do
      nil ->
        {:ok, group} = Access.create_group(%{person_id: person_id})
        group
      group -> group
    end
  end
end
