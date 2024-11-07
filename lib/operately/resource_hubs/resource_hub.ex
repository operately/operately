defmodule Operately.ResourceHubs.ResourceHub do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "resource_hubs" do
    belongs_to :space, Operately.Groups.Group
    has_one :access_context, Operately.Access.Context, foreign_key: :resource_hub_id

    field :name, :string
    field :description, :map

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(resource_hub, attrs) do
    resource_hub
    |> cast(attrs, [:space_id, :name, :description])
    |> validate_required([:space_id, :name])
  end
end
