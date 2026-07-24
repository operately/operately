defmodule Operately.Search.Entry do
  use Operately.Schema

  alias Operately.Search.Text

  @states [:closed, :completed, :archived, :paused]
  @source_types [
    :space,
    :project,
    :goal,
    :milestone,
    :task,
    :person,
    :discussion,
    :project_check_in,
    :goal_check_in,
    :project_retrospective,
    :resource_hub_document,
    :resource_hub_folder,
    :resource_hub_file,
    :resource_hub_link
  ]

  schema "search_entries" do
    field :source_type, Ecto.Enum, values: @source_types
    field :source_id, :binary_id

    belongs_to :company, Operately.Companies.Company
    belongs_to :access_context, Operately.Access.Context
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :goal, Operately.Goals.Goal

    field :title, :string
    field :normalized_title, :string
    field :body, :string, default: ""
    field :body_kind, :string
    field :state, Ecto.Enum, values: @states
    field :source_inserted_at, :naive_datetime_usec
    field :source_updated_at, :naive_datetime_usec

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [
      :source_type,
      :source_id,
      :company_id,
      :access_context_id,
      :resource_hub_id,
      :space_id,
      :project_id,
      :goal_id,
      :title,
      :body,
      :body_kind,
      :state,
      :source_inserted_at,
      :source_updated_at
    ])
    |> derive_normalized_title()
    |> validate_required([:source_type, :source_id, :company_id, :access_context_id, :title, :normalized_title, :source_updated_at])
    |> unique_constraint([:source_type, :source_id])
    |> foreign_key_constraint(:company_id)
    |> foreign_key_constraint(:access_context_id)
    |> foreign_key_constraint(:resource_hub_id)
    |> foreign_key_constraint(:space_id)
    |> foreign_key_constraint(:project_id)
    |> foreign_key_constraint(:goal_id)
  end

  defp derive_normalized_title(changeset) do
    case get_field(changeset, :title) do
      title when is_binary(title) -> put_change(changeset, :normalized_title, Text.normalize_title(title))
      _ -> changeset
    end
  end

  def source_types, do: @source_types
end
