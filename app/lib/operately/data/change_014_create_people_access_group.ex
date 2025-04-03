defmodule Operately.Data.Change014CreatePeopleAccessGroup do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access
  alias Operately.People.Person

  def run do
    Repo.transaction(fn ->
      people_ids = from(p in Person, select: p.id) |> Repo.all()

      Enum.each(people_ids, fn person_id ->
        case create_person_access_group(person_id) do
          {:error, _} -> raise "Failed to create access group"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_person_access_group(person_id) do
    case Access.get_group(person_id: person_id) do
      nil -> Access.create_group(%{person_id: person_id})
      _ -> :ok
    end
  end
end
