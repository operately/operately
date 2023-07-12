defmodule Operately.Dashboards.Panel do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "dashboard_panels" do
    belongs_to :dashboard, Operately.Dashboards.Dashboard

    field :type, :string

    field :linked_resource_id, Ecto.UUID
    field :linked_resource_type, :string

    field :index, :integer

    timestamps()
  end

  @doc false
  def changeset(panel, attrs) do
    panel
    |> cast(attrs, [:linked_resource_id, :linked_resource_type, :index, :dashboard_id, :type])
    |> validate_required([:dashboard_id, :type])
  end
end
