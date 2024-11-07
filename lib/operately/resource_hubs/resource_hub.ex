defmodule Operately.ResourceHubs.ResourceHub do
  use Operately.Schema

  schema "resource_hubs" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :access_context, Operately.Access.Context, foreign_key: :access_context_id

    field :name, :string
    field :description, :map

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(resource_hub, attrs) do
    resource_hub
    |> cast(attrs, [:space_id, :access_context_id, :name, :description])
    |> validate_required([:space_id, :access_context_id, :name])
  end
end
