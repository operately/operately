defmodule Operately.Operations.ReactionAdding do
  alias Operately.Updates.Reaction
  alias Operately.Repo

  def run(creator, entity_id, entity_type, emoji) do
    changeset = Reaction.changeset(%{
      person_id: creator.id, 
      entity_id: entity_id, 
      entity_type: entity_type, 
      emoji: emoji
    })

    Repo.insert(changeset)
  end
end
