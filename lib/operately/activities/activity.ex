defmodule Operately.Activities.Activity do
  use Ecto.Schema
  import Ecto.Changeset

  # Action Types

  @project_actions [:create]
  @update_actions [:post, :update, :comment]

  @action_types @project_actions ++ @update_actions

  # Resource Types
  @resource_types [:project, :status_update]

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "activities" do
    field :action_type, Ecto.Enum, values: @action_types
    field :resource_type, Ecto.Enum, values: @resource_types

    field :resource_id, Ecto.UUID
    field :person_id, Ecto.UUID

    timestamps()
  end

  @doc false
  def changeset(activity, attrs) do
    activity
    |> cast(attrs, [:action_type, :resource_type, :resource_id, :person_id])
    |> validate_required([:action_type, :resource_type, :resource_id, :person_id])
    |> validate_inclusion(:action_type, @action_types)
    |> validate_inclusion(:resource_type, @resource_types)
    |> validate_action_type()
  end

  defp validate_action_type(changeset) do
    action_type = get_field(changeset, :action_type)
    resource_type = get_field(changeset, :resource_type)

    posible_actions = case resource_type do
      :project -> @project_actions
      :update -> @update_actions
      nil -> []
    end

    if action_type in posible_actions do
      changeset
    else
      add_error(changeset, :action_type, "must be a #{resource_type} action #{Enum.join(posible_actions, ", ")}")
    end
  end
end
