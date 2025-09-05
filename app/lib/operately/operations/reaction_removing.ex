defmodule Operately.Operations.ReactionRemoving do
  alias Operately.Updates.Reaction
  alias Operately.Repo
  import Ecto.Query

  def run(person, entity_id, entity_type, emoji) do
    case get_user_reaction(person.id, entity_id, entity_type, emoji) do
      nil -> {:error, :reaction_not_found}
      reaction -> Repo.delete(reaction)
    end
  end

  def run_by_id(reaction_id) do
    case Repo.get(Reaction, reaction_id) do
      nil -> {:error, :reaction_not_found}
      reaction -> Repo.delete(reaction)
    end
  end

  defp get_user_reaction(person_id, entity_id, entity_type, emoji) do
    from(r in Reaction,
      where: r.person_id == ^person_id and 
             r.entity_id == ^entity_id and 
             r.entity_type == ^entity_type and 
             r.emoji == ^emoji,
      limit: 1
    )
    |> Repo.one()
  end
end