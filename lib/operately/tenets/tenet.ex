defmodule Operately.Tenets.Tenet do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "tenets" do
    belongs_to :company, Operately.Companies.Company
    has_many :kpis, Operately.Kpis.Kpi
    has_many :objectives, Operately.Okrs.Objective

    field :description, :string
    field :name, :string

    timestamps()
  end

  @doc false
  def changeset(tenet, attrs) do
    tenet
    |> cast(attrs, [:name, :description, :company_id])
    |> validate_required([:name])
  end
end
