defmodule Operately.Updates.Update do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "updates" do
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :update], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :update], foreign_key: :entity_id
    belongs_to :author, Operately.People.Person

    field :updatable_id, Ecto.UUID
    field :updatable_type, Ecto.Enum, values: [:goal, :project, :space]

    field :type, Ecto.Enum, values: [
      :message, 
      :project_discussion,
      :status_update, 
      :health_change, 
      :phase_change, 
      :review,
      :project_created,
      :project_start_time_changed,
      :project_end_time_changed,
      :project_contributor_added,
      :project_contributor_removed,
      :project_milestone_created,
      :project_milestone_completed,
      :project_milestone_deadline_changed,
      :project_milestone_deleted,
      :goal_check_in
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

    field :space, :any, virtual: true # loaded by preload_space
    field :goal, :any, virtual: true # loaded by preload_goal

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
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
    if type in [nil, :health_change, :phase_change] do
      nil
    else
      module = Macro.camelize(to_string(type))
      String.to_existing_atom("Elixir.Operately.Updates.Types.#{module}")
    end
  end

  defp format_error(change) do
    change.errors |> Enum.map(fn {key, value} -> "#{inspect(key)} #{inspect(value)}" end) |> Enum.join(", ")
  end

  def preload_space(update) when update.updatable_type == :space do
    %{update | space: Operately.Groups.get_group!(update.updatable_id)}
  end

  def preload_goal(update) when update.updatable_type == :goal do
    %{update | goal: Operately.Goals.get_goal!(update.updatable_id)}
  end

end
