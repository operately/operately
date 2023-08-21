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
      :project_created
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

    cond do
      type == :project_created ->
        change = Operately.Updates.Types.ProjectCreated.changeset(content)

        if change.valid? do
          changeset
        else
          add_error(changeset, :content, "invalid")
        end
      true -> 
        changeset
    end
  end

end
