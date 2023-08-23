defmodule Operately.Updates.Update do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "updates" do
    has_many :comments, Operately.Updates.Comment
    belongs_to :author, Operately.People.Person

    field :updatable_id, Ecto.UUID
    field :updatable_type, Ecto.Enum, values: [:objective, :project]

    field :type, Ecto.Enum, values: [
      :message, 
      :status_update, 
      :health_change, 
      :phase_change, 
      :review,
      :project_created,
      :project_milestone_created
    ]

    field :content, :map

    belongs_to :acknowledging_person, Operately.People.Person
    field :acknowledged, :boolean, default: false
    field :acknowledged_at, :utc_datetime

    field :previous_phase, :string
    field :new_phase, :string

    field :previous_health, :string
    field :new_health, :string

    field :title, :string

    timestamps()
  end

  @doc false
  def changeset(update, attrs) do
    update
    |> cast(attrs, __schema__(:fields))
    |> validate_required([
      :updatable_id,
      :updatable_type,
      :author_id,
      :type,
      :content,
    ])
    |> validate_content()
  end

  defp validate_content(changeset) do
    type = get_field(changeset, :type)
    content = get_field(changeset, :content)
    schema = find_schema(type)

    if schema do
      validate_content_on_schema(changeset, content, schema)
    else
      changeset
    end
  end

  defp validate_content_on_schema(changeset, content, schema) do
    change = schema.changeset(content)

    if change.valid? do
      changeset
    else
      add_error(changeset, :content, format_error(change))
    end
  end

  defp find_schema(type) do
    case type do
      :project_created ->
        Operately.Updates.Types.ProjectCreated

      :project_milestone_created ->
        Operately.Updates.Types.ProjectMilestoneCreated

      :status_update ->
        Operately.Updates.Types.StatusUpdate

      _ ->
        nil
    end
  end

  defp format_error(change) do
    change.errors |> Enum.map(fn {key, value} -> "#{inspect(key)} #{inspect(value)}" end) |> Enum.join(", ")
  end

end
