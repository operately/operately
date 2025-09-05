defmodule Operately.Updates.Reaction do
  use Operately.Schema
  import Ecto.Changeset

  schema "reactions" do
    belongs_to :person, Operately.People.Person

    field :entity_id, Ecto.UUID

    field :entity_type, Ecto.Enum,
      values: [
        :message,
        :update,
        :goal_update,
        :comment,
        :project_check_in,
        :comment_thread,
        :project_retrospective,
        :resource_hub_document,
        :resource_hub_file,
        :resource_hub_link
      ]

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

  def get(person, id) do
    import Ecto.Query, only: [from: 2]

    from(r in __MODULE__, where: r.id == ^id and r.person_id == ^person.id)
    |> Operately.Repo.one()
    |> case do
      nil -> {:error, :not_found}
      reaction -> {:ok, reaction}
    end
  end
end
