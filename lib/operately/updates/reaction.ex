defmodule Operately.Updates.Reaction do
  use Operately.Schema
  import Ecto.Changeset

  schema "reactions" do
    belongs_to :person, Operately.People.Person

    field :entity_id, Ecto.UUID
    field :entity_type, Ecto.Enum, values: [:update, :comment, :project_check_in]
    field :emoji, :string

    # deprecated
    field :reaction_type, Ecto.Enum, values: [:thumbs_up, :thumbs_down, :heart, :rocket]

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(reaction, attrs) do
    reaction
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:entity_id, :entity_type])
  end
end
