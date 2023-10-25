defmodule Operately.Projects.Contributor do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_contributors" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id
    belongs_to :person, Operately.People.Person, foreign_key: :person_id

    field :responsibility, :string
    field :role, Ecto.Enum, values: [:champion, :reviewer, :contributor], default: :contributor

    timestamps()
  end

  def order_by_role_and_insertion_at(query) do
    import Ecto.Query, warn: false

    from c in query, order_by: [
      asc: fragment("array_position(?, ?)", ["champion", "reviewer", "contributor"], c.role),
      asc: c.inserted_at
    ]
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(contributor, attrs) do
    contributor 
    |> cast(attrs, [:responsibility, :project_id, :person_id, :role])
    |> validate_required([:project_id, :person_id])
  end
end
