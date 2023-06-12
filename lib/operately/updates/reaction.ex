defmodule Operately.Updates.Reaction do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "reactions" do
    belongs_to :person, Operately.People.Person

    field :entity_id, Ecto.UUID
    field :entity_type, Ecto.Enum, values: [:update, :comment]
    field :reaction_type, Ecto.Enum, values: [:thumbs_up, :celebration, :heart]

    timestamps()
  end

  @doc false
  def changeset(reaction, attrs) do
    reaction
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:entity_id, :entity_type, :reaction_type])
  end
end
