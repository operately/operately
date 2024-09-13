defmodule Operately.Projects.Contributor do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "project_contributors" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id
    belongs_to :person, Operately.People.Person, foreign_key: :person_id, where: [suspended_at: nil]

    has_one :access_context, through: [:project, :access_context]

    field :responsibility, :string
    field :role, Ecto.Enum, values: [:champion, :reviewer, :contributor], default: :contributor

    field :access_level, :integer, virtual: true

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

  def load_project_access_levels(contributors) do
    people_ids = Enum.map(contributors, fn c -> c.person_id end)
    project_ids = Enum.map(contributors, fn c -> c.project_id end)

    query = from(group in Operately.Access.Group,
      join: binding in assoc(group, :bindings),
      join: context in assoc(binding, :context),
      where: group.person_id in ^people_ids and context.project_id in ^project_ids,
      group_by: [group.person_id, context.project_id],
      select: {group.person_id, context.project_id, max(binding.access_level)}
    )

    values = Repo.all(query)

    Enum.map(contributors, fn c ->
      {_, _, level} = Enum.find(values, fn {person_id, project_id, _} -> c.person_id == person_id and c.project_id == project_id end)
      Map.put(c, :access_level, level)
    end)
  end

end
