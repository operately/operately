defmodule Operately.Projects.Contributor do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "project_contributors" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id
    belongs_to :person, Operately.People.Person, foreign_key: :person_id, where: [suspended_at: nil]

    has_one :access_context, through: [:project, :access_context]

    field :responsibility, :string
    field :role, Ecto.Enum, values: [:champion, :reviewer, :contributor], default: :contributor

    timestamps()
    request_info()
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
