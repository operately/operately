defmodule Operately.Dashboards.Panel do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "dashboard_panels" do
    field :index, :integer
    field :linked_resource_id, Ecto.UUID
    field :linked_resource_type, :string
    field :dashboard_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(panel, attrs) do
    panel
    |> cast(attrs, [:linked_resource_id, :linked_resource_type, :index])
    |> validate_required([:linked_resource_id, :linked_resource_type, :index])
  end
end
