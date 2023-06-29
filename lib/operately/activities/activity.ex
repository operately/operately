defmodule Operately.Activities.Activity do
  use Ecto.Schema
  import Ecto.Changeset

  @scope_types [:project]

  @actions [
    {:project, [:create]},
    {:update, [:post, :acknowledge]},
    {:comment, [:post]},
    {:milestone, [:create, :complete, :uncomplete]}
  ]

  @action_types Enum.map(@actions, fn {_, actions} -> actions end) |> List.flatten() |> Enum.uniq()
  @resource_types Enum.map(@actions, fn {resource, _} -> resource end) |> Enum.uniq()

  @resource_schemas [
    {:project, Operately.Projects.Project},
    {:update, Operately.Updates.Update},
    {:comment, Operately.Updates.Comment},
    {:milestone, Operately.Projects.Milestone},
  ]

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "activities" do
    belongs_to :person, Operately.People.Person, foreign_key: :person_id

    field :action_type, Ecto.Enum, values: @action_types
    field :resource_type, Ecto.Enum, values: @resource_types
    field :resource_id, Ecto.UUID

    field :scope_type, Ecto.Enum, values: [:project]
    field :scope_id, Ecto.UUID

    field :event_data, :map

    timestamps()
  end

  @doc false
  def changeset(activity, attrs) do
    activity
    |> cast(attrs, [:action_type, :resource_type, :resource_id, :person_id, :scope_type, :scope_id, :event_data])
    |> validate_required([:action_type, :resource_type, :resource_id, :person_id, :scope_type, :scope_id, :event_data])
    |> validate_inclusion(:action_type, @action_types)
    |> validate_inclusion(:resource_type, @resource_types)
    |> validate_inclusion(:scope_type, @scope_types)
    |> validate_action_type()
  end

  defp validate_action_type(changeset) do
    action_type = get_field(changeset, :action_type)
    resource_type = get_field(changeset, :resource_type)
    posible_actions = Keyword.get(@actions, resource_type)

    if action_type in posible_actions do
      changeset
    else
      add_error(changeset, :action_type, "must be a #{resource_type} action #{Enum.join(posible_actions, ", ")}")
    end
  end

  def resource_types do
    @resource_types
  end

  def resource_schema(resource_type) do
    @resource_schemas |> Keyword.get(resource_type)
  end

end
