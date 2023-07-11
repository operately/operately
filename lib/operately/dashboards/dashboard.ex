defmodule Operately.Dashboards.Dashboard do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "dashboards" do
    belongs_to :company, Operately.Companies.Company
    has_many :panels, Operately.Dashboards.Panel, preload_order: [asc: :index]

    timestamps()
  end

  @doc false
  def changeset(dashboard, attrs) do
    dashboard
    |> cast(attrs, [])
    |> validate_required([])
  end
end
