defmodule Operately.Operations.CommentAdding do
  alias Operately.Repo
  alias Operately.Updates.Comment

  def run(creator, entity_id, entity_type, content) do
    changeset = Comment.changeset(%{
      author_id: creator.id,
      entity_id: entity_id,
      entity_type: String.to_existing_atom(entity_type),
      content: %{"message" => content}
    })

    Repo.insert(changeset)
  end
end
